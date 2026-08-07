#!/usr/bin/env python3
"""
KOL 美顏濾鏡 — 雙風格 (dual-style creator beauty filter)

usage: beauty_filter.py IN OUT [SMOOTH] [SLIM] [GLOW] [STYLE]
       STYLE = asian | western   (default: asian)

--- asian (抖音/小紅書風) ---
  磨皮：抹平毛孔細紋、膚色勻淨白皙
  瘦臉：下顎內推、下巴收窄 V 線
  柔光：提亮 + 降紅

--- western (Instagram clean-girl / glowy 風) ---
  **保留毛孔與雀斑**——西方審美視為健康與個性，磨掉反而假
  勻色：只在 LAB 的 a/b 色度通道抹平斑駁，**亮度細節完全保留**
  水光：高光 bloom（screen blend）做出 dewy「由內發光」感
  曬感：暖調 + 微飽和 + S 曲線對比（西方濾鏡對比高，亞洲濾鏡偏平亮）
  幾乎不變形臉型（靠打光修飾而非推臉）

兩種風格都排除眼、眉、唇、鼻孔，避免五官糊掉＝蠟像感。
"""
import sys, cv2, numpy as np, mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

IN, OUT = sys.argv[1], sys.argv[2]
SMOOTH   = float(sys.argv[3]) if len(sys.argv) > 3 else 0.65   # 磨皮/勻色強度 0-1
SLIM     = float(sys.argv[4]) if len(sys.argv) > 4 else 0.14   # 瘦臉強度 (比例)
GLOW     = float(sys.argv[5]) if len(sys.argv) > 5 else 0.18   # 柔光/水光強度
STYLE    = (sys.argv[6] if len(sys.argv) > 6 else "asian").lower()
MODEL    = "face_landmarker.task"

# face-mesh landmark groups
JAW = [172,136,150,149,176,148,152,377,400,378,379,365,397]  # 下顎輪廓（左→下巴→右）
CHIN_TIP = 152
FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,
             152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]
# 需保持銳利的區域（眼、眉、唇、鼻孔）
EYES_L = [33,133,160,159,158,157,173,155,154,153,145,144,163,7]
EYES_R = [362,263,387,386,385,384,398,382,381,380,374,373,390,249]
BROW_L = [70,63,105,66,107,55,65,52,53,46]
BROW_R = [300,293,334,296,336,285,295,282,283,276]
LIPS   = [61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,95,
          185,40,39,37,0,267,269,270,409,415,310,311,312,13,82,81,80,191]
NOSE   = [1,2,98,327,168,6,197,195,5,4,45,275,220,440]

cap = cv2.VideoCapture(IN)
W  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
H  = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
FPS= cap.get(cv2.CAP_PROP_FPS)
N  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
vw = cv2.VideoWriter(OUT, cv2.VideoWriter_fourcc(*'mp4v'), FPS, (W, H))

def pts(lms, idxs):
    return np.array([[lms[i].x*W, lms[i].y*H] for i in idxs], np.float32)

def slim_face(img, lms):
    """以下顎輪廓為基準，將臉頰/下顎往中軸內推 -> 瘦臉 + 下巴變小"""
    jaw = pts(lms, JAW)
    chin = np.array([lms[CHIN_TIP].x*W, lms[CHIN_TIP].y*H], np.float32)
    # 臉中軸 x：用鼻樑(168)與下巴平均
    axis_x = (lms[168].x*W + chin[0]) / 2.0
    face_w = np.linalg.norm(jaw[0] - jaw[-1])
    if face_w < 10:
        return img

    # 建立 remap 網格：只在下半臉區域做水平內推，強度隨接近下顎輪廓而增強
    map_x, map_y = np.meshgrid(np.arange(W, dtype=np.float32),
                               np.arange(H, dtype=np.float32))
    top_y = float(np.min(jaw[:,1])) - face_w*0.35   # 從顴骨下方開始
    bot_y = float(chin[1]) + face_w*0.10

    band = (map_y > top_y) & (map_y < bot_y)
    # 垂直權重：中段最強，兩端漸弱
    ty = np.clip((map_y - top_y) / max(bot_y - top_y, 1.0), 0, 1)
    w_v = np.sin(np.pi * ty) ** 0.8

    dx = map_x - axis_x
    # 水平權重：越靠外(接近臉緣)推越多，超出臉寬則衰減
    r = np.abs(dx) / (face_w * 0.62)
    w_h = np.exp(-((r - 1.0) ** 2) / 0.18) * np.clip(r, 0, 1.4)

    shift = SLIM * face_w * 0.5 * w_v * w_h * np.sign(dx)
    shift = np.where(band, shift, 0).astype(np.float32)
    # 往內推 = 取樣位置往外移
    return cv2.remap(img, (map_x + shift).astype(np.float32), map_y,
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

def skin_mask(lms):
    """臉部皮膚遮罩，扣掉眼眉唇鼻孔"""
    m = np.zeros((H, W), np.uint8)
    cv2.fillConvexPoly(m, cv2.convexHull(pts(lms, FACE_OVAL).astype(np.int32)), 255)
    hole = np.zeros((H, W), np.uint8)
    for grp, grow in ((EYES_L,1.5),(EYES_R,1.5),(BROW_L,1.3),(BROW_R,1.3),(LIPS,1.2),(NOSE,1.0)):
        p = pts(lms, grp).astype(np.int32)
        if len(p) >= 3:
            cv2.fillConvexPoly(hole, cv2.convexHull(p), 255)
    k = max(3, int(W*0.012)|1)
    hole = cv2.dilate(hole, np.ones((k,k), np.uint8))
    m = cv2.subtract(m, hole)
    return cv2.GaussianBlur(m, (0,0), W*0.012)

def smooth_skin(img, mask):
    """磨皮：bilateral 保邊平滑 + 高頻壓抑，只作用在皮膚遮罩內"""
    d = max(5, int(W*0.012)|1)
    base = cv2.bilateralFilter(img, d, 55, 55)
    base = cv2.bilateralFilter(base, d, 45, 45)
    # 細紋淡化：把殘餘高頻再壓一次
    lowf = cv2.GaussianBlur(base, (0,0), W*0.006)
    base = cv2.addWeighted(base, 0.55, lowf, 0.45, 0)
    a = (mask.astype(np.float32)/255.0 * SMOOTH)[...,None]
    return (img.astype(np.float32)*(1-a) + base.astype(np.float32)*a).astype(np.uint8)

def even_tone_western(img, mask):
    """西方風勻色：只抹平 LAB 的 a/b 色度斑駁，**亮度細節(毛孔/雀斑)完全保留**"""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, B = lab[...,0], lab[...,1], lab[...,2]
    sig = W * 0.018
    A_s = cv2.GaussianBlur(A, (0,0), sig)
    B_s = cv2.GaussianBlur(B, (0,0), sig)
    a = (mask.astype(np.float32)/255.0 * SMOOTH)
    lab[...,1] = A*(1-a) + A_s*a
    lab[...,2] = B*(1-a) + B_s*a
    # 只壓「大面積」亮度斑塊（泛紅不均），保留高頻毛孔
    L_low  = cv2.GaussianBlur(L, (0,0), W*0.03)
    L_flat = L + (L_low - cv2.GaussianBlur(L, (0,0), W*0.06)) * (-0.35)
    lab[...,0] = L*(1-a*0.45) + L_flat*(a*0.45)
    return cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8), cv2.COLOR_LAB2BGR)

def dewy_glow_western(img, mask):
    """水光感：高光 bloom (screen blend) + 暖曬調 + S 曲線對比"""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)/255.0
    hi = np.clip((g - 0.62) / 0.38, 0, 1)                     # 取高光
    hi = cv2.GaussianBlur(hi, (0,0), W*0.012)
    m  = mask.astype(np.float32)/255.0
    bloom = (hi * m * GLOW)[...,None]
    f = img.astype(np.float32)/255.0
    f = 1.0 - (1.0 - f) * (1.0 - bloom)                       # screen blend

    lab = cv2.cvtColor((f*255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    lab[...,2] = np.clip(lab[...,2] + 4.5*m, 0, 255)          # 暖 / 曬感
    lab[...,1] = np.clip(lab[...,1] + 1.0*m, 0, 255)
    out = cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8), cv2.COLOR_LAB2BGR)

    # 全域 S 曲線（西方濾鏡的高對比特徵）
    x = np.arange(256, dtype=np.float32)/255.0
    lut = np.clip((x - 0.5)*1.10 + 0.5 + 0.045*np.sin(2*np.pi*x - np.pi/2)*0.5, 0, 1)
    out = cv2.LUT(out, (lut*255).astype(np.uint8))
    # 微飽和
    hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[...,1] = np.clip(hsv[...,1]*1.06, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

def soft_glow(img, mask):
    """柔光 + 提亮，模擬美顏 app 的通透感"""
    bl = cv2.GaussianBlur(img, (0,0), W*0.02)
    glow = cv2.addWeighted(img, 1.0, bl, GLOW, 0)
    a = (mask.astype(np.float32)/255.0)[...,None]
    out = (img.astype(np.float32)*(1-a) + glow.astype(np.float32)*a)
    # 皮膚微提亮 + 降紅
    lab = cv2.cvtColor(out.astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    lab[...,0] = np.clip(lab[...,0] + 5.0*(mask/255.0), 0, 255)
    lab[...,1] = np.clip(lab[...,1] - 1.6*(mask/255.0), 0, 255)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)

opts = mp_vision.FaceLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=MODEL),
    running_mode=mp_vision.RunningMode.VIDEO,
    num_faces=1)

def detect(lm, bgr, ts):
    img = mp.Image(image_format=mp.ImageFormat.SRGB,
                   data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    r = lm.detect_for_video(img, ts)
    return r.face_landmarks[0] if r.face_landmarks else None

done = 0
idx = 0
with mp_vision.FaceLandmarker.create_from_options(opts) as lm:
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        ts = int(idx * 1000 / max(FPS, 1))
        pts_ = detect(lm, frame, ts)
        if pts_:
            if SLIM > 0.001:
                frame = slim_face(frame, pts_)
                # 瘦臉後重新偵測一次以對齊遮罩
                p2 = detect(lm, frame, ts + 1) or pts_
            else:
                p2 = pts_
            m = skin_mask(p2)
            if STYLE == "western":
                frame = even_tone_western(frame, m)
                frame = dewy_glow_western(frame, m)
            else:
                frame = smooth_skin(frame, m)
                frame = soft_glow(frame, m)
            done += 1
        vw.write(frame)
        idx += 1

cap.release(); vw.release()
print(f"frames with face: {done}/{N}")

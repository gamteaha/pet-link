import wave, struct, math

sample_rate = 44100
duration = 0.6 # 0.6초 (3번 뇸뇸뇸)
num_samples = int(sample_rate * duration)
filename = "nyam.wav"

f = wave.open(filename, 'w')
f.setnchannels(1)
f.setsampwidth(2)
f.setframerate(sample_rate)
f.setnframes(num_samples) # 꼭 필요한 헤더 길이 정보

frames = []
for i in range(num_samples):
    t = i / sample_rate
    
    # 0.2초마다 한 번씩 "뇸" 소리가 반복되도록 설정
    nyam_t = t % 0.2
    
    # 주파수(음높이)가 600Hz에서 시작해서 아래로 훅 떨어짐
    phase = 2 * math.pi * (600 * nyam_t - 1500 * nyam_t**2)
    
    # 메인 음색 (부드러운 싸인파) + 입모양 배음
    signal = math.sin(phase) + 0.3 * math.sin(phase * 2.5)
    
    # 각 "뇸" 마다 볼륨이 줄어드는 효과
    envelope = (1.0 - (nyam_t / 0.2)) ** 1.5
    overall_fade = (1.0 - (t / duration))
    
    value = int(signal * envelope * overall_fade * 32767 * 0.5)
    
    # 클리핑 방지
    if value > 32767: value = 32767
    if value < -32768: value = -32768
    
    frames.append(struct.pack('<h', value))

# 한 번에 정상적으로 파일 기록 (헤더 오류 방지)
f.writeframes(b''.join(frames))
f.close()
print("뇸뇸 WAV 파일 정상 생성 완료")

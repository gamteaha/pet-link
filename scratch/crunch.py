import wave, struct, random, math
import os

sample_rate = 44100
duration = 0.4
num_samples = int(sample_rate * duration)
filename = "crunch.wav"

f = wave.open(filename, 'w')
f.setnchannels(1)
f.setsampwidth(2)
f.setframerate(sample_rate)

for i in range(num_samples):
    t = i / sample_rate
    
    # 여러 번 씹는 소리를 위해 싸인파로 볼륨 굴곡을 줌 (와작! 와작!)
    crunch_pattern = math.sin(t * 30) ** 2
    
    # 노이즈 베이스
    noise = random.uniform(-1, 1)
    
    # 초기 어택이 강하게 (점점 감소하는 볼륨)
    envelope = max(0, math.exp(-t * 8)) * crunch_pattern
    
    value = int(noise * envelope * 32767 * 0.4)
    
    # 16bit 정수로 패킹
    f.writeframesraw(struct.pack('<h', value))

f.close()
print("WAV 파일 생성 완료")

#!/usr/bin/env python3
"""Synthesize 4 copyright-free mood beds (60 s loops) into assets/bgm/. Pure FFmpeg lavfi, no samples."""
import subprocess, os
D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "bgm"); os.makedirs(D, exist_ok=True)
T = 60
TR = {
 # dark drone + heartbeat (~70 bpm lub-dub) + night wind
 "suspense": "aevalsrc='0.22*sin(2*PI*55*t)*(0.7+0.3*sin(2*PI*0.07*t))+0.16*sin(2*PI*58.3*t)+0.08*sin(2*PI*82.4*t)*(0.5+0.5*sin(2*PI*0.11*t))':d={T}[dr];"
             "aevalsrc='0.9*sin(2*PI*60*t)*exp(-28*mod(t,0.86))+0.6*sin(2*PI*52*t)*exp(-28*mod(t-0.24,0.86))*gte(mod(t,0.86),0.24)':d={T},lowpass=f=140[hb];"
             "anoisesrc=d={T}:c=brown:a=0.5,lowpass=f=500,highpass=f=80,tremolo=f=0.15:d=0.7,volume=0.35[w];"
             "[dr][hb][w]amix=3:normalize=0,volume=0.9",
 # fast tension percussion (~140 bpm) + low ostinato + panting breath layer
 "chase": "aevalsrc='0.9*sin(2*PI*(45+120*exp(-25*mod(t,0.43)))*mod(t,0.43))*exp(-9*mod(t,0.43))':d={T}[k];"
          "anoisesrc=d={T}:c=white:a=0.6,highpass=f=6000,volume='if(lt(mod(t,0.215),0.03),0.5,0.02)':eval=frame[hh];"
          "aevalsrc='0.18*sin(2*PI*if(lt(mod(t,1.72),0.86),73.4,77.8)*t)*(0.6+0.4*sin(2*PI*4.65*t))':d={T}[os];"
          "anoisesrc=d={T}:c=pink:a=0.8,bandpass=f=1100:width_type=h:w=900,volume='pow(abs(sin(PI*1.25*t)),6)*0.9':eval=frame[br];"
          "[k][hh][os][br]amix=4:normalize=0,volume=0.85",
 # soft major pad + flute-like pentatonic melody + forest birds/air
 "peaceful": "aevalsrc='0.07*(sin(2*PI*261.6*t)+sin(2*PI*329.6*t)+sin(2*PI*392*t))*(0.8+0.2*sin(2*PI*0.2*t))':d={T}[p];"
             "aevalsrc='0.12*sin(2*PI*(if(lt(mod(t,8),2),523.3,if(lt(mod(t,8),4),587.3,if(lt(mod(t,8),6),659.3,784))))*t+0.004*sin(2*PI*5*t))*(1-exp(-6*mod(t,2)))*exp(-0.6*mod(t,2))':d={T}[fl];"
             "aevalsrc='0.05*sin(2*PI*(3200+900*sin(2*PI*18*t))*t)*gt(sin(2*PI*0.37*t),0.93)*gt(sin(2*PI*9*t),0)':d={T}[bd];"
             "anoisesrc=d={T}:c=pink:a=0.12,lowpass=f=2500[air];[p][fl][bd][air]amix=4:normalize=0",
 # warm I-V-vi-IV cinematic progression with slow swell
 "victory": "aevalsrc='0.06*(sin(2*PI*if(lt(mod(t,16),4),130.8,if(lt(mod(t,16),8),196,if(lt(mod(t,16),12),220,174.6)))*t)+sin(2*PI*if(lt(mod(t,16),4),261.6,if(lt(mod(t,16),8),246.9,if(lt(mod(t,16),12),261.6,220)))*t)+sin(2*PI*if(lt(mod(t,16),4),329.6,if(lt(mod(t,16),8),293.7,if(lt(mod(t,16),12),329.6,261.6)))*t)+sin(2*PI*if(lt(mod(t,16),4),392,if(lt(mod(t,16),8),392,if(lt(mod(t,16),12),440,349.2)))*t))*(0.75+0.25*sin(2*PI*0.25*t))':d={T},aecho=0.8:0.6:120:0.3",
}
for name, g in TR.items():
    out = f"{D}/{name}.m4a"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-filter_complex", g.replace("{T}", str(T)) +
        ",afade=t=in:d=0.5,loudnorm=I=-20:TP=-3,aformat=channel_layouts=stereo:sample_rates=48000[o]", "-map", "[o]", "-t", str(T),
        "-c:a", "aac", "-b:a", "128k", out], check=True)
    print("ok", out)

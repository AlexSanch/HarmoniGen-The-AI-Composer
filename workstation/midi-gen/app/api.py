from flask import Flask, jsonify, request, send_from_directory, url_for
import subprocess
import time as t
from midiutil import MIDIFile
from mingus.core import progressions

app = Flask(__name__)

port = 8083

def note_to_pitch(note_name):
    # Mapping of note names to MIDI pitch values
    note_pitch = {
        "C": 0, "C#": 1, "Db": 1, "C##": 2, "Dbb": 0,
        "D": 2, "D#": 3, "Eb": 3, "D##": 4, "Ebb": 1,
        "E": 4, "Fb": 4, "F": 5, "E#": 5, "Fbb": 3,
        "F#": 6, "Gb": 6, "G": 7, "F##": 7, "Gbb": 5,
        "G#": 8, "Ab": 8, "A": 9, "G##": 9, "Abb": 7,
        "A#": 10, "Bb": 10, "B": 11, "A##": 11, "Bbb": 9,
        "Cb": 11, "B#": 0, "Cbb": 10
    }

    # Extract pitch and octave information from note name
    pitch_name = note_name[:-1]
    octave = int(note_name[-1])

    # Calculate MIDI pitch value using the formula
    base_pitch = note_pitch[pitch_name]
    pitch = base_pitch + (octave + 1) * 12

    return pitch


progression = [
    ["I", "V", "VI", "IV"],
    ["VI", "IV", "I", "V"],
    ["I", "IV", "V", "V"],
    ["II", "V", "I", "IV"],
    ["III", "VI", "II", "V"],
    ["V", "IV", "I", "I"],
    ["I", "IV", "V", "VI"],
    ["I", "V", "IV", "IV"],
    ["VI", "IV", "I", "I"],
    ["I", "V", "III", "IV"],
    ["I", "VI", "II", "V"],
    ["IV", "V", "I", "VI"]
]

instrument = [
    "Guitar.sf2",
    "Orchestra.sf2",
    "Piano.sf2",
]

@app.route('/get-file', methods=['POST'])
def create_audio():
    try:
        data = request.json
        print(data)
        # Base Settings
        tempo = data["tempo"]
        melody_duration = data["duration"]
        # Notes Ratio
        ratio = data["ratio"]
        # Progression Selection and Octave Difference
        selection = data["progression"]
        octavedif = data["octavediff"]

        # Base Melody
        base = [
            (data["basemelody"], 1)
        ]

        for _ in range(int(tempo*(melody_duration/60))-4):
            base.append(base[0])

        # Progressions

        chords_progression = progressions.to_chords(
            progression[selection], data["chordprogression"])

        # Initialize the MIDIFile object
        midi_file = MIDIFile(1)  # One track

        # Add track information
        track = 0
        time = 0
        counter = 0
        midi_file.addTempo(track, time, tempo)
        # Add left hand chords to the MIDI file

        chords_counter = 0
        for note, duration in base:
            if (counter % ratio) == 0:
                # Add note to MIDI file
                volume = 127  # 0-127, as per the MIDI standard
                octave = str(int(note[-1])-octavedif)
                pitch1 = note_to_pitch(
                    chords_progression[chords_counter][0]+octave)
                pitch2 = note_to_pitch(
                    chords_progression[chords_counter][1]+octave)
                pitch3 = note_to_pitch(
                    chords_progression[chords_counter][2]+octave)
                midi_file.addNote(track, 0, pitch1, time, ratio, volume)
                midi_file.addNote(track, 0, pitch2, time, ratio, volume)
                midi_file.addNote(track, 0, pitch3, time, ratio, volume)
                if "7" in progression[chords_counter]:
                    pitch4 = note_to_pitch(
                        chords_progression[chords_counter][3]+octave)
                    midi_file.addNote(track, 0, pitch4, time, ratio, volume)
                chords_counter += 1
                if chords_counter == len(chords_progression):
                    chords_counter = 0
            counter += duration
            time += duration

        # Save the MIDI file
        with open("midi/input.mid", "wb") as output_file:
            midi_file.writeFile(output_file)

        print("MIDI file saved as input.mid")
        
        filename = "output/output"+t.strftime("%Y%m%d%H%M%S")+".wav"

        p1 = subprocess.Popen(["fluidsynth", "-ni", "fonts/" + instrument[data["instrument"]], "midi/input.mid", "-F",
                               filename, "-r", "44100"], shell=False, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        p1.wait()
        print("ok")
        return "http://localhost:"+str(port)+"/" + filename
    except Exception as e:
        print(e)
        return 'Error Input JSON'

@app.route('/output/<path:path>', methods=['GET'])
def send_report(path):
    return send_from_directory('output', path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port)

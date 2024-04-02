# HarmoniGen-The-AI-Composer

<img src="https://i.ibb.co/ZSSjZtF/Harmoni.png" width="700">

An innovative music composition device powered by AI and Jetson Orin Nano. It is designed for musicians, composers, and anyone looking to effortlessly create original music compositions.

# Materials:

Hardware:
- NVIDIA Jetson Nano Orin.                                x1.
https://developer.nvidia.com/embedded/learn/get-started-jetson-orin-nano-devkit

Software:
- Llama.cpp
https://github.com/ggerganov/llama.cpp
- Docker:
https://www.docker.com/
- JetPack 6.0 DP:
https://developer.nvidia.com/embedded/jetpack-sdk-60dp
- NextJS:
https://nextjs.org/
- Fluidsynth:
https://www.fluidsynth.org/
- Musescore
https://musescore.com/
=
# Introduction:

In the vast world of music production, it can seem like a daunting challenge to master all of the music theory concepts behind it, as well as deal with the hardware and work required behind this entire process.

<img src="https://i.ibb.co/Dg3DN9F/Image.png" width="700">

However, with the continuous advancement of technology, the incorporation of GAI (Generative Artificial Intelligence) and GPU processing has opened a range of possibilities to make the art of musical composition available to everyone, allowing a spectrum broader and more diverse number of people can access it, that's why I present my project HarmoniGen The AI Composer.

<img src="https://i.ibb.co/C8WnYwz/image.png" width="700">

# Solution:

HarmoniGen is a solution to make melodies easily through text entry thanks to the Llama.cpp models thanks to a graphical interface in the form of a WebPage.

<img src="https://i.ibb.co/9wgZk30/Image.png" width="700">

# Connection Diagram:

This is the connection diagram of the system:

<img src="https://i.ibb.co/1M8hj9F/Harmoni-Gen-drawio.png" width="700">

The entire system is managed by docker compose, Docker's native container orchestrator, through which we can run the three containers correctly and configured to use the Nvidia runtime.

# System Setup:

## SDK Manager:

To make the Jetson Orin Nano work we must flash the Jetpack on our board, for this process the SDK Manager will be used to select the necessary components.

<img src="https://i.ibb.co/jHZ2w4X/image.png" width="700">

Especially you must install the NVIDIA Container Runtime, with this we can have docker and the compose orchestrator. Previous versions of version 6.0 DP do not contain compose.

<img src="https://i.ibb.co/JtqdfD3/image.png" width="700">

## Containers Setup:

To configure the containers within our board we will first have to carry out the jetson-containers installation process.

    sudo apt-get update && sudo apt-get install git python3-pip
    git clone --depth=1 https://github.com/dusty-nv/jetson-containers
    cd jetson-containers
    pip3 install -r requirements.txt

We added docker to $USER so we can use docker without sudo.

    sudo usermod -aG docker $USER

Finally, we must generate a swap memory twice the current ram memory of the board, that is, 16GB.

    sudo systemctl disable nvzramconfig
    sudo fallocate -l 16G /mnt/16GB.swap
    sudo mkswap /mnt/16GB.swap
    sudo swapon /mnt/16GB.swap

And finally to have the containers ready, you must download the [workstation](./workstation/docker-compose.yml) folder and run the following commands.

    cd workstation
    docker compose build

This will download and configure all containers ready to go.

# Orchestrator:

Once we have all the containers and system ready to run, we can use the orchestrator to start the system.

    docker compose up -d

Within the docker-compose.yml file we can see the execution details, although there are some details that must be highlighted.

- Networking: the network configuration in which the containers run will be internal between them, preconfigured ports and with a static IP.

        networks:
            harmonynet:
                driver: bridge
                ipam:
                    config:
                        - subnet: 172.20.0.0/16

- Services: the orchestrator manages the containers as microservices.
   - MIDI-API: manages the creation of MIDI files through an API.
   - NextJS: Provides the graphical interface through a web browser, to make the melodies.
   - Llama.cpp: Provides an API interface to perform llama invocations.
     
# MIDI-API:

The purpose of this microservice is to generate the melodies and convert them into midi files, in addition to being able to play them in the browser.

## Mingus Core:

This module provides the project with a series of notations and musical theory to be able to generate sequences of chords, scales and correct notes.

<img src="https://bspaans.github.io/python-mingus/_images/lpexample.png" width="700">

Specifically in popular music, the generation of melodies and songs are based mostly on already known chord progressions.

<img src="https://i.ibb.co/XztrBKX/image.png" width="400">

Manually programming all these chord progressions is extremely tedious, so for this reason, the library provides us with several tools to generate these progressions.

    chords_progression = progressions.to_chords(progression[selection], data["chordprogression"])

## Midiutil:

Since we can generate chord sequences and basic melodies, we must have the ability to generate MIDI files with these sequences and have the ability to play them.

<img src="https://i.ibb.co/Vv96rWx/image.png" width="700">

Therefore, it is important to have the basic values of each note, this will help us generate all the others. Starting with 0 as the lowest note on the piano, in turn its equivalences in flats and sharps, due to the Mignus library we also added the equivalences of double flat and double sharp.

    note_pitch = {
        "C": 0, "C#": 1, "Db": 1, "C##": 2, "Dbb": 0,
        "D": 2, "D#": 3, "Eb": 3, "D##": 4, "Ebb": 1,
        "E": 4, "Fb": 4, "F": 5, "E#": 5, "Fbb": 3,
        "F#": 6, "Gb": 6, "G": 7, "F##": 7, "Gbb": 5,
        "G#": 8, "Ab": 8, "A": 9, "G##": 9, "Abb": 7,
        "A#": 10, "Bb": 10, "B": 11, "A##": 11, "Bbb": 9,
        "Cb": 11, "B#": 0, "Cbb": 10
    }

Now with these equivalences we can create MIDI files from musical notes.

    def note_to_pitch(note_name):
        # Pitch Map
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

## Fluidsynth:

Since we can provide MIDI files to the system, we have to be able to play them as musical instruments. Thanks to this Linux utility it is possible to play MIDI files as if they were played by musical instruments.

<img src="https://i.ibb.co/7tkBwhQ/image.png" width="700">

To play musical instruments, FONTS are used, which are files embedded with information about musical instruments. There are several open source libraries with many different fonts. Please add the ones you like to the system to make different melodies.

https://sites.google.com/site/soundfonts4u/

The files that we use in this project as POC are the following.

- [Guitar](https://drive.google.com/file/d/18CCYj8AFy7wpDdGg0ADx8GfTTHEFilrs/view?usp=sharing)
- [Piano](https://drive.google.com/file/d/1nvTy62-wHGnZ6CKYuPNAiGlKLtWg9Ir9/view?usp=sharing)
- [Orchestra](https://drive.google.com/file/d/1c0pCI0YdcFEpSLEbCW8HTzFOlJpz0HS9/view?usp=sharing)

## API:

Since we can generate the audio programmatically, it is better to have the ability to do it through an API, as this will prevent integration with our graphical interface, so Flask was used to create an API.

<img src="https://i.ibb.co/F7RTDcN/68747470733a2f2f692e6962622e636f2f4c3947775072632f.png" width="700">

Within the application this microservice is running on port 8083 with a static internal IP.

    ports:
        - "8083:8083"
    networks:
        harmonynet:
            ipv4_address: 172.20.0.2

# Llama.cpp:

The second pillar of the project is to be able to make the melodies through a text interface, generating the effect of having a Text2Music interface.

<img src="https://i.ibb.co/mqMpf1H/image.png" width="700">

Thanks to the good work of Llama.cpp, this llama service can be used through a web server, so I created a Llama microservice with which I can make text generation requests through the API.

    ports:
        - "8080:8080"
    networks:
        harmonynet:
            ipv4_address: 172.20.0.4

In addition, this container must run with an initial command, since all this is described in the docker-compose.yml.

    command: /bin/bash -c "./server --model /model/llama-2-7b.Q5_K_M.gguf --ctx-size 512 --batch-size 256 --n-gpu-layers 999 --threads $(nproc) --n-predict 512 --host 172.20.0.4 --port 8080 --alias HarmoniGen"

With this service we can make API requests using JSON.

    {
        "prompt": `YOUR PROMPT`,
        "n_predict": 128,
        "logit_bias": [[`
            {
            \"progression\" : 0,
            \"instrument\" : 0,
            \"octavediff\" : 1,
            \"chordprogression\" : "C", 
            }
        `, 0.9]],
        "stop": ["### Examples:", "Examples", "This is", "def", "Where:", '"""', '#', "<div>", "</div>", "The"]
    }

This is the description of the parameters and what function they have for the generation.

- prompt: This parameter can be varied to improve the result, but it is the basis for the generation of the text that will be generated, in this case a JSON with the MIDI generation parameters.
- n_predict: the length of the text that will be generated.
- logic_bias: This parameter will force the AI to generate a useful text response for us.
- stop: These keywords stop the text generation.

The model we use for this project is called-2-7b.Q5_K_M.gguf, which provides us, according to the official documentation, with the best performance vs processing cost.

<img src="https://i.ibb.co/NyzmMTS/image.png" width="700">

# NextJS:

As the last link we have the graphical interface as a webpage, using the NextJS framework.

<img src="https://i.ibb.co/0mvL0mL/nextjs3.webp" width="700">

## API:

Using NextJS it is possible to manage the entire server side and the communication between containers from the same framework.

<img src="https://i.ibb.co/gybWs6T/image.png" width="700">

All the API details are in the following folder.

[API](./workstation/nextjs-docker/pages/api/)

However, it must be clarified that this API is part of the server, not the client, since if you try to access the container services outside of these APIs, they will give a CORS error since they are configured to work with the internal network. This was done as it is ready for deployment in production.

<img src="https://i.ibb.co/1brDqVd/Harmoni-Gen-New-drawio.png" width="400">

## AI Composer:

The first section of the website is the AI composer, which has the function of generating basic audios, which we can choose the basic parameters of the media and in turn the AI (the Llama model) will decide the rest of the parameters of the composition .

<img src="https://i.ibb.co/82KZ4Dg/image.png" width="700">

Giving an example of this, we carried out a test with a very well-known song.

<img src="https://i.ibb.co/Wn3TBsC/image.png" width="700">

Once the file is done, the website will respond with an alert that it was done correctly.

<img src="https://i.ibb.co/1Z1V90T/image.png" width="700">

## Manual Composer:

The manual composer is a bypass of the AI, where you can fine-tune the melody if you think it is necessary, it is not the most recommended since the AI generates the best option.

<img src="https://i.ibb.co/3mpPJtC/image.png" width="700">

## MIDI Player:

Once the file is generated, we can play it in the same browser and use it for whatever we want.

<img src="https://i.ibb.co/q017HfF/image.png" width="700">

# The Final Product:



### Epic DEMO:

Video: Click on the image
[![Video](https://i.ibb.co/ZSSjZtF/Harmoni.png)](pending...)

Sorry github does not allow embed videos.



## References:

Links:

(1) Mignus Core: https://bspaans.github.io/python-mingus/index.html

(2) TheBloke Models: https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF

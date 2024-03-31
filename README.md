# HarmoniGen-The-AI-Composer

<img src="https://i.ibb.co/ZSSjZtF/Harmoni.png" width="1000">

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

# Introduction:



# Solution:

HarmoniGen es una solucion para relizar melodias de forma sencilla mediante una entrada de texto gracias a los modelos de Llama.cpp gracias a una interfaz grafica con forma de WebPage.

<img src="https://i.ibb.co/9wgZk30/Image.png" width="1000">

# Connection Diagram:

This is the connection diagram of the system:

<img src="https://i.ibb.co/1M8hj9F/Harmoni-Gen-drawio.png" width="1000">

Todo el sistema esta gestionado por docker compose, el orquestador de contenedores nativo de Docker, mediante el podemos ejecutar los tres contenedores correctamente y configurados para utilizar el runtime de Nvidia.

# System Setup:

## SDK Manager:

Para hacer funcionar la Jetson Orin Nano debemos realizar el flash de Jetpack en nuestra board, para este proceso se utilizara el SDK Manager para seleccionar los componentes necesarios.

<img src="https://i.ibb.co/jHZ2w4X/image.png" width="1000">

Especialmente debes de instalar los NVIDIA Container Runtime, con esto podremos tener docker y el orquestador compose. Versiones anteriores de la version 6.0 DP no contienen compose.

<img src="https://i.ibb.co/JtqdfD3/image.png" width="1000">

## Containers Setup:

Para configurar los contenedores dentro de nuestra board primero tendremos que realizar el proceso de instalacion de jetson-containers.

    sudo apt-get update && sudo apt-get install git python3-pip
    git clone --depth=1 https://github.com/dusty-nv/jetson-containers
    cd jetson-containers
    pip3 install -r requirements.txt

Agregamos docker a $USER para poder usar docker sin sudo.

    sudo usermod -aG docker $USER

Por ultimo debemos de generar una memoria swap del doble de la memoria ram actual de la board, osea 16GB.

    sudo systemctl disable nvzramconfig
    sudo fallocate -l 16G /mnt/16GB.swap
    sudo mkswap /mnt/16GB.swap
    sudo swapon /mnt/16GB.swap

Y finalmente para tener los contenedores listos, debes de descargar la carpeta [workstation](./workstation/docker-compose.yml) y correr los siguiente comandos.

    cd workstation
    docker compose build

Esto descargara y configurara todos los contenedores para dejarlos listos para funcionar.

# Orchestrator:

Una vez teniendo todos los contenedores y sistema listos para ejecutar, podremos utilizar el orquestador para iniciar el sistema.

    docker compose up -d

Dentro del archivo docker-compose.yml podremos ver los detalles de ejecucion, aunque hay algunos detalles que hay que resaltar.

- Networking: la configuracion del red en la que correran los contenedores sera interna entre ellos, puertos preconfigurados y con una ip estatica.

    networks:
        harmonynet:
            driver: bridge
            ipam:
                config:
                    - subnet: 172.20.0.0/16

- Services: el orquestador gestiona los contenedores como micro servicios. 
  - MIDI-API: gestiona la creacion de archivos MIDI mediante una API.
  - NextJS: Provee la interfaz grafica a travez de navegador web, para realizar las melodias.
  - Llama.cpp: Provee una interfaz API para realizar las invocaciones de llama.

# MIDI-API:

Este microservicio tiene como fin generar las melodias y convertirlas en archivos midi, ademas de poder reprodicirlas en el navegador.

## Mingus Core:

Este modulo provee al proyecto una serie de notaciones y teoria musical para poder generar secuencias de acordes, escalas y notas correctas.

<img src="https://bspaans.github.io/python-mingus/_images/lpexample.png" width="1000">

Especificamente en la musica popular la generacion de melodias y canciones estan basadas mayormente en progresiones de acordes ya conocidos.

<img src="https://i.ibb.co/XztrBKX/image.png" width="400">

Programar manualmente todas estas progresiones de acordes es sumamente tedioso, asi que por esta razon, la libreria nos provee de varias herramientas para generar estas progresiones.

    chords_progression = progressions.to_chords(progression[selection], data["chordprogression"])

## Midiutil:

Ya que podemos generar secuencias de acordes y melodias basicas, debemos de tener la capacidad de generar archivos MIDI con estas secuencias y tener la capacidad de reproducirlos. 

<img src="https://i.ibb.co/Vv96rWx/image.png" width="1000">

Por lo tanto es importante tener los valores basicos de cada nota, esto nos servira para generar todas las demas. Empezando por el 0 como la nota mas grave del piano, a su vez sus equivalencias en bemoles y sostenidos, debido a la libreria Mignus agregamos tambien las equivalencias de doble bemol y doble sostenido.

    note_pitch = {
        "C": 0, "C#": 1, "Db": 1, "C##": 2, "Dbb": 0,
        "D": 2, "D#": 3, "Eb": 3, "D##": 4, "Ebb": 1,
        "E": 4, "Fb": 4, "F": 5, "E#": 5, "Fbb": 3,
        "F#": 6, "Gb": 6, "G": 7, "F##": 7, "Gbb": 5,
        "G#": 8, "Ab": 8, "A": 9, "G##": 9, "Abb": 7,
        "A#": 10, "Bb": 10, "B": 11, "A##": 11, "Bbb": 9,
        "Cb": 11, "B#": 0, "Cbb": 10
    }

Ahora con estas equivalencias podremos crear los arhivos MIDI a partir de notas musicales.

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

Ya que podemos proveer archivos MIDI al sistema, tenemos que poder reproducirlos como instrumentos musicales, gracias a esa utilidad de linux es posible reproducir los archivos MIDI como si fueran ejecutados por instrumentos musicales.

<img src="https://i.ibb.co/7tkBwhQ/image.png" width="1000">

Para reproducir los instrumentos musicales se utilizan FONTS, las cuales son archivos embebidos con la informacion de los intrumentos musicales, hay varias librerias open source con muchas fonts dinstintas, porfavor agrega las que gustes al sistema para realizar melodias diferentes.

https://sites.google.com/site/soundfonts4u/

Los archivos que utilizamos en este proyecto como POC son los siguientes.

- [Guitar](https://drive.google.com/file/d/18CCYj8AFy7wpDdGg0ADx8GfTTHEFilrs/view?usp=sharing)
- [Piano](https://drive.google.com/file/d/1nvTy62-wHGnZ6CKYuPNAiGlKLtWg9Ir9/view?usp=sharing)
- [Orchestra](https://drive.google.com/file/d/1c0pCI0YdcFEpSLEbCW8HTzFOlJpz0HS9/view?usp=sharing)

## API:

Ya que podemos generar los audios de forma programatica, es mejor tener la capacidad de hacerlo mediante una API, ya que esto failitara la integracion con nuestra interfaz grafica, asi que se utilizo Flask para crear una API.

<img src="https://i.ibb.co/L9GwPrc/image.png" width="1000">

Dentro de la aplicacion este microservicio esta corriendo en el puerto 8083 con una ip interna estatica.

    ports:
        - "8083:8083"
    networks:
        harmonynet:
            ipv4_address: 172.20.0.2

# Llama.cpp:

El segundo pilar del proyecto es poder realizar las melodias mediante una interfaz de texto, generando el efecto de tener una interfaz de Text2Music.

<img src="https://i.ibb.co/mqMpf1H/image.png" width="1000">

Gracias a el buen trabajo de Llama.cpp este servicio de llama es posible usarlo a traves de un servidor web, asi que realice un microservicio de Llama con el cual puedo realizar las peticiones de generacion de texto mediante API.

    ports:
        - "8080:8080"
    networks:
        harmonynet:
            ipv4_address: 172.20.0.4

Ademas este contenedor debe de correr con un comando inicial, ya todo esto esta descrito en el docker-compose.yml.

    command: /bin/bash -c "./server --model /model/llama-2-7b.Q5_K_M.gguf --ctx-size 512 --batch-size 256 --n-gpu-layers 999 --threads $(nproc) --n-predict 512 --host 172.20.0.4 --port 8080 --alias HarmoniGen"

Con este servicio podemos realizar peticiones API mediante JSON.

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

Esta es la descripcion de los parametros y que funcion tiene para la generacion.

- prompt: Este parametro puede variarse para mejorar el resultado, pero es la base de la generacion del texto que se va a generar, en este caso un JSON con los parametros de generacion del MIDI.
- n_predict: la longitud del texto que se generara.
- logic_bias: Este parametros va a forzar la AI para generar una respuesta de texto util patra nosotros. 
- stop: Estas palabras clave detienen la generacion de texto.

El modelo que utilizamos para este proyecto es llama-2-7b.Q5_K_M.gguf que nos provee segun la documentacion oficial el mejor rendimiento vs costo de procesamiento.

<img src="https://i.ibb.co/NyzmMTS/image.png" width="1000">

# NextJS:

Como ultimo eslabon tenemos la interfaz grafica como webpage, utilizando el framework de NextJS.

<img src="https://i.ibb.co/0mvL0mL/nextjs3.webp" width="1000">

## API:

Mediante NextJS es posible gestional todo el lado de servidor y la comunicacion entre contendores desde el mismo framework.

<img src="https://i.ibb.co/gybWs6T/image.png" width="1000">

Todos los detalles de la API estan en la siguiente carpeta.

[API](./workstation/nextjs-docker/pages/api/)

Sin embargo hay que aclarar que esta API es parte del servidor, no del cliente, ya que si tratas de acceder a los servicios de los contenedores fuera de estas API, daran un error de CORS ya que estan configurados para funcionar con internal network. Esto se realizo asi ya que esta listo para despliegue en produccion.

<img src="https://i.ibb.co/1brDqVd/Harmoni-Gen-New-drawio.png" width="400">

## AI Composer:

La primera seccion de la pagina web es el AI composer, el cual tiene la funcion de generar audios basicos, los cuales podemos elegir los parametros basicos de la medodia y a su vez la AI (el modelo Llama) decidira el resto de prametros de la composicion.

<img src="https://i.ibb.co/82KZ4Dg/image.png" width="1000">

Poniendo un ejemplo de esto, realizamos una prueba con una cancion muy conocida.

<img src="https://i.ibb.co/Wn3TBsC/image.png" width="1000">

Una vez se realiza en archivo la pagina web nos respondera con una alerta de que se realizo correctamente.

<img src="https://i.ibb.co/1Z1V90T/image.png" width="1000">

## Manual Composer:

El compositor manual es un bypass de la AI, donde puedes realizar el Finetuning de la melodia si lo crees necesario, no es lo mas recomendable ya que la AI genera la mejor opcion.

<img src="https://i.ibb.co/3mpPJtC/image.png" width="1000">

## MIDI Player:

Una vez generado el archivo ya podemos reproducirlo en el mismo navegador y usarlo para lo que queramos.

<img src="https://i.ibb.co/q017HfF/image.png" width="1000">

# The Final Product:



### Epic DEMO:

Video: Click on the image
[![Video](https://i.ibb.co/HF2PRKZ/VidSynth.png)](pending...)

Sorry github does not allow embed videos.

# Commentary:



## References:

Links:

(1) Mignus Core: https://bspaans.github.io/python-mingus/index.html

(2) TheBloke Models: https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF
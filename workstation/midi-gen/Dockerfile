FROM python:3.8-alpine
RUN apk add --update fluidsynth
RUN pip3 install midiutil mingus flask
COPY . .
WORKDIR /app
CMD ["python3", "api.py"]
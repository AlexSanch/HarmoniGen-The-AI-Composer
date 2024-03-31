"use client";
import Head from "next/head";
import React from "react";
import styles from "../styles/Home.module.css";
import { createRef, useState } from "react";
import { isMobile } from "react-device-detect";
import Player from "@madzadev/audio-player";
import "@madzadev/audio-player/dist/index.css";
import { toast } from "react-hot-toast";

// Function to extract JSON from a string
function extractJSON(text) {
  // Find the starting and ending indexes of JSON
  const startIndex = text.indexOf('{');
  const endIndex = text.indexOf('}');

  // Extract the JSON substring
  const jsonSubstring = text.substring(startIndex, endIndex + 1);

  try {
    // Parse the JSON
    const json = JSON.parse(jsonSubstring);
    return json;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

function parseNumericString(inputString) {
  if (!isNaN(inputString)) { // Check if inputString is a number
      return parseInt(inputString); // Parse inputString to integer
  } else {
      return inputString; // Return the original string
  }
}

export default function Home() {
  const [selector, setSelector] = useState(0);
  const [myForm, setMyForm] = useState({
    tempo: 90,
    duration: 60,
    ratio: 4,
    progression: 0,
    octavediff: 1,
    basemelody: "C5",
    chordprogression: "C",
    instrument: 0,
  });
  const [songs, setSongs] = useState([
    {
      url: "http://localhost:8080/output/output.wav",
      title: "HarmoniGen AI",
      tags: ["pop"],
      timestamp: (new Date()).toString()
    },
  ])
  const inputRef = createRef(null);

  const handleForm = (e) => {
    if (e.target.type === "number") {
      console.log({ [e.target.name]: parseInt(e.target.value) })
      setMyForm({ ...myForm, [e.target.name]: parseInt(e.target.value) });
    }
    else if (e.target.name === "progression" || e.target.name === "instrument") {
      console.log({ [e.target.name]: parseInt(e.target.value) })
      setMyForm({ ...myForm, [e.target.name]: parseInt(e.target.value) });
    }
    else {
      console.log({ [e.target.name]: e.target.value })
      setMyForm({ ...myForm, [e.target.name]: e.target.value });
    }
  };

  const handler = async (route, myJson = myForm) => {
    if (route === "/api/midi") {
      console.log("MIDI");
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify(myJson);
      console.log(raw)

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(route, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          console.log(result)
          if (result === "Error Input JSON") {
            toast.error("MIDI Generation Failed!");
          } else {
            toast.success("MIDI Generated Successfully!");
            console.log([
              {
                url: result,
                title: "HarmoniGen AI",
                tags: ["pop"],
                timestamp: (new Date()).toString()
              },
            ])
            setSongs([
              {
                url: result,
                title: "HarmoniGen AI",
                tags: ["pop"],
                timestamp: (new Date()).toString()
              },
            ])
          }
        })
        .catch((error) => {
          toast.error("MIDI Generation Failed!");
          console.error(error);
        });
    } else if (route === "/api/ai") {
      console.log("AI");
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      const raw = JSON.stringify({
        prompt: `

        Available progressions:
        0. I, V, VI, IV
        1. VI, IV, I, V
        2. I, IV, V, V
        3. II, V, I, IV
        4. III, VI, II, V
        5. V, IV, I, I
        6. I, IV, V, VI
        7. I, V, IV, IV
        8. VI, IV, I, I
        9. I, V, III, IV
        10. I, VI, II, V
        11. IV, V, I, VI
        

        You are a program that decide what features values a song should have according to its description. \n The features to complete are:
        
        - progression: this is the chord progression, select one of the available progressions, only give the number like '1'.
        - octavediff: diference of octave between base melody and chorus, the interval value is from 0 to 3, no negative numbers.  
        - chordprogression: this is the main note of the notes progression, use a letter as note like "C" or "A".
        - instrument: instrument options from guitar, orchesta or piano, use 0 for guitar, 1 form orchesta and 2 for piano. For example '0'.
        
        The song description is the following and is delimited by triple quotes. 
        
        '''${inputRef}''' 
        
        Return all the features values that best fit the song and and your return must be only a json format, with every feature key asigned with integer or text value without comments. 
        
        Your JSON:
        `,
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
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(route, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          console.log(result.content)
          let extractedJSON = extractJSON(result.content)
          console.log("Extracted JSON:", extractedJSON);
          let base  = myForm;
          const labels = ["chordprogression", "progression","octavediff", "instrument" ]
          labels.forEach(label => {
            try{
              if(extractedJSON[label] !== undefined){
                base[label] = parseNumericString(extractedJSON[label])
              } 
            }
            catch{
            }
          })
          labels.forEach( label =>{
            try{
              if(typeof(base[label]) !== typeof(myForm[label])){
                base[label] = myForm[label]
              }
            }
            catch{
            }
          })
          setMyForm(base)
          handler("/api/midi", base)
        })
        .catch((error) => {
          toast.error("MIDI Generation Failed!");
          console.error(error);
        });
    } else if (route === "/api/hello") {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };

      fetch(route, requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    }
  };

  const selectorStyle = {
    borderRadius: "10px",
    height: "24px",
    width: "200px",
    border: "1px solid black",
    fontSize: "1.2rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0px 0px 0px 0px",
    textAlign: "center",
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>HarmoniGen</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1 className={styles.title} style={{ margin: "40px 0px" }}>
          Welcome to{" "}
          <a href="https://github.com/AlexSanch/HarmoniGen-The-AI-Composer">
            HarmoniGen
          </a>
          <br />
          on Nvidia Containers
        </h1>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "0px 0px 40px 0px",
          }}
        >
          <button
            style={{
              borderRadius: "10px 0px 0px 10px",
              width: "160px",
              height: "60px",
              color: "white",
              backgroundColor: "black",
              marginTop: "10px",
            }}
            onClick={() => setSelector(0)}
          >
            <div style={{ textAlign: "center", fontSize: "1.2rem" }}>
              AI Composer
            </div>
          </button>
          <button
            style={{
              borderRadius: "0px 0px 0px 0px",
              width: "160px",
              height: "60px",
              color: "white",
              backgroundColor: "black",
              marginTop: "10px",
            }}
            onClick={() => setSelector(1)}
          >
            <div style={{ textAlign: "center", fontSize: "1.2rem" }}>
              Manual
              <br />
              Composer
            </div>
          </button>
          <button
            style={{
              borderRadius: "0px 10px 10px 0px",
              width: "160px",
              height: "60px",
              color: "white",
              backgroundColor: "black",
              marginTop: "10px",
            }}
            onClick={() => setSelector(2)}
          >
            <div style={{ textAlign: "center", fontSize: "1.2rem" }}>
              MIDI Player
            </div>
          </button>
        </div>
        {selector === 0 && (
          <React.Fragment>
            <h2 style={{ margin: "0px 0px 10px 0px", textAlign: "center" }}>
              Enter MIDI parameters
            </h2>
            <form
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: "50px",
                width: "auto",
                borderWidth: "1px",
                borderRadius: "10px",
                borderStyle: "solid",
                borderColor: "black",
                padding: "30px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h4>Tempo:</h4>
                <input
                  style={selectorStyle}
                  type="number"
                  name="tempo"
                  value={myForm.tempo}
                  onChange={handleForm}
                />
                <h4>Duration:</h4>
                <input
                  style={selectorStyle}
                  type="number"
                  name="duration"
                  value={myForm.duration}
                  onChange={handleForm}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h4>Base Melody:</h4>
                <select
                  style={selectorStyle}
                  name="basemelody"
                  value={myForm.basemelody}
                  onChange={handleForm}
                >
                  <option value="A0">A0</option>
                  <option value="B0">B0</option>
                  <option value="C1">C1</option>
                  <option value="D1">D1</option>
                  <option value="E1">E1</option>
                  <option value="F1">F1</option>
                  <option value="G1">G1</option>
                  <option value="A1">A1</option>
                  <option value="B1">B1</option>
                  <option value="C2">C2</option>
                  <option value="D2">D2</option>
                  <option value="E2">E2</option>
                  <option value="F2">F2</option>
                  <option value="G2">G2</option>
                  <option value="A2">A2</option>
                  <option value="B2">B2</option>
                  <option value="C3">C3</option>
                  <option value="D3">D3</option>
                  <option value="E3">E3</option>
                  <option value="F3">F3</option>
                  <option value="G3">G3</option>
                  <option value="A3">A3</option>
                  <option value="B3">B3</option>
                  <option value="C4">C4</option>
                  <option value="D4">D4</option>
                  <option value="E4">E4</option>
                  <option value="F4">F4</option>
                  <option value="G4">G4</option>
                  <option value="A4">A4</option>
                  <option value="B4">B4</option>
                  <option value="C5">C5</option>
                  <option value="D5">D5</option>
                  <option value="E5">E5</option>
                  <option value="F5">F5</option>
                  <option value="G5">G5</option>
                  <option value="A5">A5</option>
                  <option value="B5">B5</option>
                  <option value="C6">C6</option>
                  <option value="D6">D6</option>
                  <option value="E6">E6</option>
                  <option value="F6">F6</option>
                  <option value="G6">G6</option>
                  <option value="A6">A6</option>
                  <option value="B6">B6</option>
                  <option value="C7">C7</option>
                  <option value="D7">D7</option>
                  <option value="E7">E7</option>
                  <option value="F7">F7</option>
                  <option value="G7">G7</option>
                  <option value="A7">A7</option>
                  <option value="B7">B7</option>
                  <option value="C8">C8</option>
                </select>
                <h4>Ratio:</h4>
                <input
                  style={selectorStyle}
                  type="number"
                  name="ratio"
                  value={myForm.ratio}
                  onChange={handleForm}
                />
              </div>
            </form>
            <h2 style={{ margin: "20px 0px 0px 0px", textAlign: "center" }}>
              Enter your song description
            </h2>
            <form
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                margin: "20px 0px",
              }}
              onSubmit={(e) => {
                e.preventDefault();
                handler("/api/ai");
              }}
            >
              <textarea
                ref={inputRef}
                type="text"
                style={{
                  width: isMobile ? "90vw" : "30vw",
                  height: isMobile ? "90vh" : "20vh",
                  borderRadius: "10px",
                  padding: "10px",
                  fontSize: "1.2rem"
                }}
              />
              <button
                style={{
                  borderRadius: "10px",
                  width: "200px",
                  height: "60px",
                  color: "white",
                  backgroundColor: "black",
                  marginTop: "20px",
                }}
                type="submit"
              >
                <div style={{ textAlign: "center", fontSize: "1.5rem" }}>
                  Generate Midi
                </div>
              </button>
            </form>
          </React.Fragment>
        )}
        {selector === 1 && (
          <React.Fragment>
            <h2 style={{ margin: "0px 0px 10px 0px", textAlign: "center" }}>
              Enter MIDI parameters
            </h2>
            <form
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: "50px",
                width: "auto",
                borderWidth: "1px",
                borderRadius: "10px",
                borderStyle: "solid",
                borderColor: "black",
                padding: "30px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h4>Tempo:</h4>
                <input
                  style={selectorStyle}
                  type="number"
                  name="tempo"
                  value={myForm.tempo}
                  onChange={handleForm}
                />
                <h4>Duration:</h4>
                <input
                  style={selectorStyle}
                  type="number"
                  name="duration"
                  value={myForm.duration}
                  onChange={handleForm}
                />
                <h4>Ratio:</h4>
                <input
                  style={selectorStyle}
                  type="number"
                  name="ratio"
                  value={myForm.ratio}
                  onChange={handleForm}
                />
                <h4>Progression:</h4>
                <select
                  style={selectorStyle}
                  name="chordprogression"
                  value={myForm.chordprogression}
                  onChange={handleForm}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h4>Octave Difference:</h4>
                <input
                  style={selectorStyle}
                  type="number"
                  name="octavediff"
                  value={myForm.octavediff}
                  onChange={handleForm}
                />
                <h4>Base Melody:</h4>
                <select
                  style={selectorStyle}
                  name="basemelody"
                  value={myForm.basemelody}
                  onChange={handleForm}
                >
                  <option value="A0">A0</option>
                  <option value="B0">B0</option>
                  <option value="C1">C1</option>
                  <option value="D1">D1</option>
                  <option value="E1">E1</option>
                  <option value="F1">F1</option>
                  <option value="G1">G1</option>
                  <option value="A1">A1</option>
                  <option value="B1">B1</option>
                  <option value="C2">C2</option>
                  <option value="D2">D2</option>
                  <option value="E2">E2</option>
                  <option value="F2">F2</option>
                  <option value="G2">G2</option>
                  <option value="A2">A2</option>
                  <option value="B2">B2</option>
                  <option value="C3">C3</option>
                  <option value="D3">D3</option>
                  <option value="E3">E3</option>
                  <option value="F3">F3</option>
                  <option value="G3">G3</option>
                  <option value="A3">A3</option>
                  <option value="B3">B3</option>
                  <option value="C4">C4</option>
                  <option value="D4">D4</option>
                  <option value="E4">E4</option>
                  <option value="F4">F4</option>
                  <option value="G4">G4</option>
                  <option value="A4">A4</option>
                  <option value="B4">B4</option>
                  <option value="C5">C5</option>
                  <option value="D5">D5</option>
                  <option value="E5">E5</option>
                  <option value="F5">F5</option>
                  <option value="G5">G5</option>
                  <option value="A5">A5</option>
                  <option value="B5">B5</option>
                  <option value="C6">C6</option>
                  <option value="D6">D6</option>
                  <option value="E6">E6</option>
                  <option value="F6">F6</option>
                  <option value="G6">G6</option>
                  <option value="A6">A6</option>
                  <option value="B6">B6</option>
                  <option value="C7">C7</option>
                  <option value="D7">D7</option>
                  <option value="E7">E7</option>
                  <option value="F7">F7</option>
                  <option value="G7">G7</option>
                  <option value="A7">A7</option>
                  <option value="B7">B7</option>
                  <option value="C8">C8</option>
                </select>
                <h4>Chord Progression:</h4>
                <select
                  style={selectorStyle}
                  name="progression"
                  value={myForm.progression}
                  onChange={handleForm}
                >
                  <option value={0}>I, V, VI, IV</option>
                  <option value={1}>VI, IV, I, V</option>
                  <option value={2}>I, IV, V, V</option>
                  <option value={3}>II, V, I, IV</option>
                  <option value={4}>III, VI, II, V</option>
                  <option value={5}>V, IV, I, I</option>
                  <option value={6}>I, IV, V, VI</option>
                  <option value={7}>I, V, IV, IV</option>
                  <option value={8}>VI, IV, I, I</option>
                  <option value={9}>I, V, III, IV</option>
                  <option value={10}>I, VI, II, V</option>
                  <option value={11}>IV, V, I, VI</option>
                </select>
                <h4>Instrument:</h4>
                <select
                  style={selectorStyle}
                  name="instrument"
                  value={myForm.instrument}
                  onChange={handleForm}
                >
                  <option value={0}>Guitar</option>
                  <option value={1}>Orchestra</option>
                  <option value={2}>Piano</option>
                </select>
              </div>
            </form>
            <div style={{ textAlign: "center", fontSize: "1.5rem" }}>
              <button
                style={{
                  borderRadius: "10px",
                  width: "200px",
                  height: "60px",
                  color: "white",
                  backgroundColor: "black",
                  marginTop: "20px",
                }}
                onClick={() => handler("/api/midi")}
              >
                <div style={{ textAlign: "center", fontSize: "1.5rem" }}>
                  Generate Midi
                </div>
              </button>
            </div>
          </React.Fragment>
        )}
        {selector === 2 && (
          <React.Fragment>
            <Player
              includeTags={false}
              includeSearch={false}
              showPlaylist={false}
              sortTracks={false}
              autoPlayNextTrack={false}
              trackList={songs}
            />
          </React.Fragment>
        )}
      </main>
    </div>
  );
}

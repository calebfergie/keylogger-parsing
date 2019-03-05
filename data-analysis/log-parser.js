//written by Rafe Lepre (https://www.github.com/HyphnKnight) updated by caleb
//reads a caleb.src file and spits out JSONs as defined in fs.write command

const fs = require('fs');
const buffer = fs.readFileSync('caleb.src', 'utf8');

//JSONs for output data
const inputs = {};
const grams = {
  bi: {},
  tri: {},
};

//variables for the buffer
let characterIndex = -1;
const characterLength = buffer.length;

//array for ngrams
const history = [];

//move through the buffer one character at a time
while (++characterIndex < characterLength) {
  const initialPosition = characterIndex;
  let char = buffer[characterIndex];

  if (char === '[') { //the start of a command (e.g. [shift] or [return])
    let command = ''; //start a 'command' variable with nothing in it (skip over the '[')

    while ((char = buffer[++characterIndex]) !== ']') { //buffer through until reaching a "]"
      if (!char) break; //if the next character is causing issues, break outta here
      if (char === '[') continue; //if the next character is also a "[", skip over it
      command += char; //add each character to the command variable
    }
    addToInputs(command,"command"); //add (or update) the freq of the inputs array with the command
    ngramMagic(command); //do ngram magic!

  } else if (char !== ' ') { //if the character is not a space or a '[' (i.e. if its a letter/number)
    let word = char; //start a 'word' varable with the first character
    while ((char = buffer[++characterIndex]) !== '[' && char !== ' ') { //buffer through until hitting a space or '['
      if (!char) break; //if the next character is causing issues, break outta here
      word += char; //add the character to the word
    }

    addToInputs(word,"character"); //add (or update the freq) of the inputs array with the word
    --characterIndex; //don't remember why this is necessary for words only
    ngramMagic(word); //do ngram magic!
  }

}

var freqFilter = 100; //minimum number of occurences to be included in the output
filterGrams(grams,freqFilter); //filter out ngrams that have less than freqFilter occurances

//create variables for each of the json files I want
const commandsByFrequency =  Object.keys(inputs)
    .map(input => inputs[input])
    .filter(({type}) => type === 'command')
    .sort((a, b) => a.frequency - b.frequency)

const wordsByFrequency = Object.keys(inputs)
  .map(input => inputs[input])
  .filter(({type}) => type === 'word')
  .sort((a, b) => a.frequency - b.frequency)

const filteredBigrams = Object.keys(grams.bi)
    .map(input => grams.bi[input])
    .sort((a, b) => a.frequency - b.frequency)

const filteredTrigrams = Object.keys(grams.tri)
  .map(input => grams.tri[input])
  .sort((a, b) => a.frequency - b.frequency)


// console.log(JSON.stringify(filteredTrigrams));
// write to a new file
fs.writeFile('commands.json', JSON.stringify(commandsByFrequency), (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    console.log('updated JSON');
});

//FUNCTIONS

//add or update word/command to inputs array
function addToInputs(value,type) {
  if (!inputs[value]) { //if the isnt listed yet / doesn't exist
    inputs[value] = {   //add it to the inputs array
      value: value,
      type: type,
      frequency: 1,
    };
  } else { //otherwise, update its frequency
    inputs[value].frequency += 1;
  }
}

//"IT SCALES LINEARLY" - aka the history array is limited to 3 objects
function ngramMagic(keystroke) {
  history.push(keystroke);
  if (history.length > 3) history.shift(); //keep the history array length at 3 objects
  const biGram = history.slice(0, 2).join('_'); //define the current bigram of the array in computer readable _ linked stuff
  const triGram = history.join('_'); //do the same for current the trigrame
  if (!grams.bi[biGram]) { //if the bigram is not already in there add it to the bigrams array
    grams.bi[biGram] = {
      value: history.slice(0, 2),
      frequency: 1,
    };
  } else { //otherwise, update its frequency
    grams.bi[biGram].frequency += 1;
  }
  if (!grams.tri[triGram]) { //if the trigram is not already in there add it to the trigrams array
    grams.tri[triGram] = {
      value: history.slice(0, 3),
      frequency: 1,
    };
  } else { //otherwise, update its frequency
    grams.tri[triGram].frequency += 1;
  }
}

//dont really know how accumulators work so im just gonna leave this as-is
function filterGrams(array,freq) {
  grams.bi = Object.keys(grams.bi).reduce((acc, bi) => {
  if (grams.bi[bi].frequency > freq) {
    acc[bi] = grams.bi[bi];
  }
  return acc;
}, {});

grams.tri = Object.keys(grams.tri).reduce((acc, tri) => {
  if (grams.tri[tri].frequency > freq) {
    acc[tri] = grams.tri[tri];
  }
  return acc;
}, {});
}

//not currently used/working
function writeJSON (filename,contents) {
  fs.write(filename+'.json', JSON.stringify(contents), (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('updated'+ filename +'JSON');
  });
}

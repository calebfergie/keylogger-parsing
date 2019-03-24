//written by Rafe Lepre (https://www.github.com/HyphnKnight) updated by caleb
//reads a keystroke.log file and spits out JSON data about the log file
//also creates a JSON that can be used to make sankey diagrams (graph)

const fs = require('fs');
const buffer = fs.readFileSync('./public/data/keystroke.log', 'utf8');

//JSONs for output data
const inputs = {};
const grams = {
  bi: {},
  tri: {},
};

//variables to create d3 JSON file
const nodes = [];
const links = [];

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

var freqFilter = 250; //minimum number of occurences to be included in the output
filterGrams(grams,freqFilter); //filter out ngrams that have less than freqFilter occurances

//create variables for each of the json files I want
const commandsByFrequency =  Object.keys(inputs)
    .map(input => inputs[input])
    .filter(({type}) => type === 'command')
    .sort((a, b) => b.frequency - a.frequency)

const wordsByFrequency = Object.keys(inputs)
  .map(input => inputs[input])
  .filter(({type}) => type === 'character')
  .sort((a, b) => b.frequency - a.frequency)

const filteredBigrams = Object.keys(grams.bi)
    .map(input => grams.bi[input])
    .sort((a, b) => b.frequency - a.frequency)

const filteredTrigrams = Object.keys(grams.tri)
  .map(input => grams.tri[input])
  .sort((a, b) => b.frequency - a.frequency)

  // write the jsons to files
  fs.writeFile('./public/data/commands.json', JSON.stringify(commandsByFrequency), (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('updated commands JSON');
  });

  fs.writeFile('./public/data/words.json', JSON.stringify(wordsByFrequency), (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('updated words JSON');
  });

  fs.writeFile('./public/data/bigrams.json', JSON.stringify(filteredBigrams), (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('updated bigrams JSON');
  });

  fs.writeFile('./public/data/trigrams.json', JSON.stringify(filteredTrigrams), (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('updated trigrams JSON');
  });

// CODE TO GENERATE A JSON D3.SANKEY LIKES

//holding cells for unique "source" and "target" values
const firstWords = [];
const secondWords = [];

//go through each bigram
for (var bg in filteredBigrams) {

  // create nodes portion of d3 array
  // create source nodes aka first parts of bigram
  let source = filteredBigrams[bg].value[0];
  //ANNOYING WORKAROUND FOR WORDS THAT ARE ALSO ARRAY METHODS - NOT BEING PICKED UP OTHERWISE
  if (source.match(/^(push|find|keys|some|map|shift|every|pop|unshift)$/)) {
    source = source + "_"
}
  if(!firstWords[source]) {
    firstWords[source] = {"name": source};
    nodes.push({
      "name": source,
      "type": "source"
    });
  }

  // create target nodes aka second parts of bigram
  let target = filteredBigrams[bg].value[1];
  //ANNOYING WORKAROUND FOR WORDS THAT ARE ALSO ARRAY METHODS - NOT BEING PICKED UP OTHERWISE
  if (target.match(/^(push|find|keys|some|map|shift|every|pop|unshift)$/)) {
    target = target + "_"
}
  if(!secondWords[target]) {
    secondWords[target] = {"name": target};
    nodes.push({
      "name": target,
      "type": "target"
    });
  }

  // find positions of source and target values to create links array for d3
  let sourcePos = findPos(source,nodes,"source");
  let targetPos = findPos(target,nodes,"target");
  let value = filteredBigrams[bg].frequency;
  links.push({
    "source": sourcePos,
    "target": targetPos,
    "value": value
  });
}

// combine the two arrays into the JSON object d3 is expecting
const graph = {
  "nodes": nodes,
  "links": links
}

// write the json to a file
fs.writeFile('./public/data/bigrams-sankey.json', JSON.stringify(graph), (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;
    // success case, the file was saved
    console.log('updated bigrams-sankey JSON');
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

function findPos(keystroke,nodes,type) {
  // adapted from https://stackoverflow.com/questions/36419195/get-index-from-a-json-object-with-value/36419269
  var index = -1;
  var filteredObj = nodes.find(function(item, i){
  if(item.name === keystroke && item.type === type){
    index = i;
  }
});
// console.log(keystroke +"'s position is: " + index);
//quick error handling
if (index == -1) {
  console.log("could not find " + keystroke +  " of type " +type+" in the nodes array - this will create an error in the sankey diagram");
}
return index;
}

//not currently used. Not working, recieve error: TypeError [ERR_INVALID_ARG_TYPE]: The "fd" argument must be of type number. Received type string
function writeJSON (filename,contents) {
  var filepath = './public/data/'+filename+'.json'
  console.log(filepath);
  fs.write(filepath, JSON.stringify(contents), (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('updated'+ filename +'JSON');
  });
}

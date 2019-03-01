const {readFileSync} = require('fs');
const buffer= readFileSync('caleb.src','utf8');

const inputs = {};
const grams = {
    bi: {},
    tri: {},
};

let characterIndex = -1;
const characterLength = buffer.length;

const history = [];


while(++characterIndex < characterLength) {
    const initialPosition =  characterIndex;

    let char = buffer[characterIndex];

    if(char === '[') {
        // this is a command
         let command = '';

        while((char = buffer[++characterIndex]) !== ']') {
            if(!char) break;
            if(char === '[') continue;
            command += char;
        }
        if(!inputs[command]) {
            inputs[command] = {
                value: command,
                type:'command',
                frequency: 1,
                //positions: [initialPosition],
            };
        } else {
            inputs[command].frequency +=1;
            //inputs[command].positions.push(initialPosition);
        }
        history.push(command);
        if(history.length > 3) history.shift();
        const biGram =  history.slice(0,2).join('_');
        const triGram =  history.join('_');
        if(!grams.bi[biGram]) {
            grams.bi[biGram] = {
                value: history.slice(0,2),
                frequency: 1,
            };
        } else {
            grams.bi[biGram].frequency +=1;
        }
        if(!grams.tri[triGram]) {
            grams.tri[triGram] = {
                value: history.slice(0,3),
                frequency: 1,
            };
        } else {
            grams.tri[triGram].frequency +=1;
        }
    } else if(char !== ' ') {
        let word = char;
        while((char = buffer[++characterIndex]) !== '[' && char !== ' ') {
            if(!char) break;
            word += char;
        }
        if(!inputs[word]) {
            inputs[word] = {
                value: word,
                type:'word',
                frequency: 1,
                //positions: [initialPosition],
            };
        } else {
            inputs[word].frequency +=1;
            //inputs[word].positions.push(initialPosition);
        }
        --characterIndex;
        history.push(word);
        if(history.length > 3) history.shift();
        const biGram =  history.slice(0,2).join('_');
        const triGram =  history.join('_');
        if(!grams.bi[biGram]) {
            grams.bi[biGram] = {
                value: history.slice(0,2),
                frequency: 1,
            };
        } else {
            grams.bi[biGram].frequency +=1;
        }
        if(!grams.tri[triGram]) {
            grams.tri[triGram] = {
                value: history.slice(0,3),
                frequency: 1,
            };
        } else {
            grams.tri[triGram].frequency +=1;
        }
    }

}

grams.bi = Object.keys(grams.bi).reduce((acc,bi)=>{
    if(grams.bi[bi].frequency > 1) {
        acc[bi] = grams.bi[bi];
    }
    return acc;
},{});

grams.tri = Object.keys(grams.tri).reduce((acc,tri)=>{
    if(grams.tri[tri].frequency > 1) {
        acc[tri] = grams.tri[tri];
    }
    return acc;
},{});

const output = {
    inputs,
    commandsByFrequency: Object.keys(inputs)
        .map(input => inputs[input])
        .filter(({type}) => type ==='command' )
        .sort((a,b)=>a.frequency-b.frequency),
    wordsByFrequency: Object.keys(inputs)
        .map(input => inputs[input])
        .filter(({type}) => type ==='word' )
        .sort((a,b)=>a.frequency-b.frequency),
    grams,
    biByFrequency: Object.keys(grams.bi)
        .map(input => grams.bi[input])
        .sort((a,b)=>a.frequency-b.frequency),
    triByFrequency: Object.keys(grams.tri)
        .map(input => grams.tri[input])
        .sort((a,b)=>a.frequency-b.frequency),
};

console.log(JSON.stringify(output));

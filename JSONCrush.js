/////////////////////////////////////////////////////////////////////// 
// JSONCrush by Frank Force [MIT] https://github.com/KilledByAPixel/JSONCrush
// Based on JSCrush - Javascript crusher by @aivopaas. [MIT] http://www.iteral.com/jscrush
/////////////////////////////////////////////////////////////////////// 

"use strict"; // strict mode

function JSONCrush(string)
{
    const JSCrush=(string, characters)=>
    {
        // JSCrush Algorithm (remove repeated substrings)
        const ByteLength = string=>encodeURI(string).replace(/%../g,'i').length;
        const HasUnmatchedSurrogate = string=>
        {
            // check ends of string for unmatched surrogate pairs
            let c1 = string.charCodeAt(0);
            let c2 = string.charCodeAt(string.length-1);
            return (c1 >= 0xDC00 && c1 <= 0xDFFF) || (c2 >= 0xD800 && c2 <= 0xDBFF);
        }
        
        const maxSubstringLength = 50; // speed it up by limiting max length
        let X, B, O, m, i, c, e, N, M, o, t, j, x, R,k;
        let Q = characters;
        let s = string;
        X = 1;
        m = '';
        i=0;
        while(true)
        {
            for (M=N=e=c=0,i=Q.length;!c&&i--;)
                !~s.indexOf(Q[i])&&(c=Q[i]);
            if (!c) break;
            if (O)
            {
                o={};
                for (x in O)
                    for (j=s.indexOf(x),o[x]=0;~j;o[x]++)
                        j=s.indexOf(x,j+x.length);
                O=o;
            }
            else for (O=o={},t=1;X&&t<maxSubstringLength;t++)
                    for (X=k=0;++k<s.length-t;)
                        if (!HasUnmatchedSurrogate(x=s.substr(j=k,t)))
                            if (!o[x])
                                if (~(j=s.indexOf(x,j+t)))
                                        for (X=t,o[x]=1;~j;o[x]++)
                                            j=s.indexOf(x,j+t);
            for (let x in O) 
            {
                j=ByteLength(x);
                if (j=(R=O[x])*j-j-(R+1)*ByteLength(c))
                    (j>M||j==M&&R>N)&&(M=j,N=R,e=x);
                if (j<1)
                    delete O[x]
            }
            o={};
            for(let x in O)
                o[x.split(e).join(c)]=1;
            O=o;
            if(!e) break;
            let s2 = s.split(e).join(c)+c+e;
            
            // check if shorter
            let length = ByteLength(encodeURIComponent(s));
            let newLength = ByteLength(encodeURIComponent(s2+c));
            if (newLength >= length)
                break;
            
            s = s2;
            m = c+m;
        }

        return {a:s, b:m};
    }

    // remove \u0001 if it is found in the string so it can be used as a delimiter
    string = string.replace(/\u0001/g,'');
    
    // swap out common json characters
    string = JSONCrushSwap(string);
    
    // create a string of characters that will not be escaped by encodeURIComponent
    let characters = [];
    const unescapedCharacters = `-_.!~*'()`;
    for (let i=127; --i;)
    {
        if 
        (
            (i>=48&&i<=57) || // 0-9
            (i>=65&&i<=90) || // A-Z
            (i>=97&&i<=122)|| // a-z
            unescapedCharacters.includes(String.fromCharCode(i))
        )
            characters.push(String.fromCharCode(i));
    }
    
    // pick from extended set last
    for (let i=33; i<255; ++i)
    {
        let c = String.fromCharCode(i);
        if (c!='\\' && !characters.includes(c))
            characters.unshift(c);
    }
    
    // crush with JS crush
    const crushed = JSCrush(string, characters);
    
    // use \u0001 as a delimiter between JSCrush parts 
    const crushedString = crushed.a + '\u0001' + crushed.b;
    
    // encode URI
    return encodeURIComponent(crushedString);
}

function JSONUncrush(string)
{
    // string must be a decoded URI component, searchParams.get() does this automatically

    // unsplit the string
    const splitString = string.split('\u0001');
    
    // JSUncrush algorithm
    let a = splitString[0];
    let b = splitString[1];
    for(let c in b)
    {
        let d = a.split(b[c]);
        a = d.join(d.pop());
    }
    
    // unswap the json characters in reverse direction
    return JSONCrushSwap(a, 0);
}

function JSONCrushSwap(string, forward=true)
{
    // swap out characters for lesser used ones that wont get escaped
    const swapGroups = 
    [
        ['"', "'"],
        ["':", "!"],
        [",'", "~"],
        ['}', ")", '\\', '\\'],
        ['{', "(", '\\', '\\'],
    ];
    
    const Swap=(string, g)=>
    {
        let regex = new RegExp(`${(g[2]?g[2]:'')+g[0]}|${(g[3]?g[3]:'')+g[1]}`,'g');
        return string.replace(regex, $1 => ($1 === g[0] ? g[1] : g[0]));
    }

    // need to be able to swap characters in reverse direction for uncrush
    if (forward)
        for (let i=0; i<swapGroups.length; ++i)
            string = Swap(string, swapGroups[i]);
    else
        for (let i=swapGroups.length; i--;)
            string = Swap(string, swapGroups[i]);

    return string;
}
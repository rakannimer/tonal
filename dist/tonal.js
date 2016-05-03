'use strict';

// # Tonal

// __tonal__ is a functional music theory library. It deals with abstract music
// concepts like picthes and intervals, not actual music.

// `tonal` is also the result of my journey of learning how to implement a music
// theory library in javascript in a functional way.

// You are currently reading the source code of the library. It's written in
// [literate programming](https://en.wikipedia.org/wiki/Literate_programming) as
// a tribute to the The Haskell School of Music and it's impressive book/source
// code ["From Signals to
// Symphonies"](http://haskell.cs.yale.edu/wp-content/uploads/2015/03/HSoM.pdf)
// that has a big influence over tonal development.

// This page is generated using the documentation tool
// [docco](http://jashkenas.github.io/docco/)

// #### Prelude

// Parse note names with `note-parser`
const noteParse = require('note-parser').parse
// Parse interval names with `interval-notation`
const ivlNttn = require('interval-notation')

// Utilities

// Is an array?
const isArr = Array.isArray
// Is a number?
const isNum = (n) => typeof n === 'number'
// Is string?
const isStr = (o) => typeof o === 'string'
// Is defined? (can be null)
const isDef = (o) => typeof o !== 'undefined'
// Is a value?
const isValue = (v) => v !== null && typeof v !== 'undefined'

// __Functional helpers__

// Identity function
const id = (x) => x

// ## 1. Pitches

// An array with the signature: `['tnl', fifths, octaves, direction]`:

/**
 * Create a pitch class in array notation
 *
 * @function
 * @param {Integer} fifhts - the number of fifths from C
 * @return {Pitch} the pitch in array notation
 */
const pcArr = (f) => ['tnl', f]

/**
 * Create a note pitch in array notation
 *
 * @function
 * @param {Integer} fifhts - the number of fifths from C
 * @param {Integer} octaves - the number of encoded octaves
 * @return {Pitch} the pitch in array notation
 */
const noteArr = (f, o) => ['tnl', f, o]

// calculate interval direction
const calcDir = (f, o) => encDir(7 * f + 12 * o)

/**
 * Create an interval in array notation
 *
 * @function
 * @param {Integer} fifhts - the number of fifths from C
 * @param {Integer} octaves - the number of encoded octaves
 * @param {Integer} dir - (Optional) the direction
 * @return {Pitch} the pitch in array notation
 */
const ivlPitch = (f, o, d) => ['tnl', f, o, d || calcDir(f, o) ]

/**
 * Test if a given object is a pitch
 * @function
 * @param {Object} obj - the object to test
 * @return {Boolean}
 */
const isPitch = (p) => p && p[0] === 'tnl'
/**
 * Test if a given object is a pitch class
 * @function
 * @param {Object} obj - the object to test
 * @return {Boolean}
 */
const isPitchClass = (p) => isPitch(p) && p.length === 2
/**
 * Test if a given object is a pitch with octave (note pitch or interval)
 * @function
 * @param {Object} obj - the object to test
 * @return {Boolean}
 */
const hasOct = (p) => isPitch(p) && isNum(p[2])
/**
 * Test if a given object is a note pitch
 * @function
 * @param {Object} obj - the object to test
 * @return {Boolean}
 */
const isNotePitch = (p) => hasOct(p) && p.length === 3
/**
 * Test if a given object is a pitch interval
 * @function
 * @param {Object} obj - the object to test
 * @return {Boolean}
 */
const isIvlPitch = (i) => hasOct(i) && isNum(i[3])
/**
 * Test if a given object is a pitch, but not an interval
 * @function
 * @param {Object} obj - the object to test
 * @return {Boolean}
 */
const isPitchNotIvl = (i) => isPitch(i) && !isDef(i[3])


// #### Pitch encoding

// Map from letter step to number of fifths and octaves
// equivalent to: { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 }
const FIFTHS = [0, 2, 4, -1, 1, 3, 5]

// Encode a pitch class using the step number and alteration
const encPC = (step, alt) => FIFTHS[step] + 7 * alt

// Given a number of fifths, return the octaves they span
const fOcts = (f) => Math.floor(f * 7 / 12)
// Get the number of octaves it span each step
const FIFTH_OCTS = FIFTHS.map(fOcts)

// Encode octaves
const encOct = (step, alt, oct) => oct - FIFTH_OCTS[step] - 4 * alt

// Encode direction
const encDir = (n) => n < 0 ? -1 : 1

/**
 * Create a pitch. A pitch in tonal may refer to a pitch class, the pitch
 * of a note or an interval.
 *
 * @param {Integer} step - an integer from 0 to 6 representing letters
 * from C to B or simple interval numbers from unison to seventh
 * @param {Integer} alt - the alteration
 * @param {Integer} oct - the pitch octave
 * @param {Integer} dir - (Optional, intervals only) The interval direction
 * @return {Pitch} the pitch encoded as array notation
 *
 */
function encode (step, alt, oct, dir) {
  // is valid step?
  if (step < 0 || step > 6) return null

  const pc = encPC(step, alt || 0)
  // if not octave, return the pitch class
  if (!isNum(oct)) return pcArr(pc)

  const o = encOct(step, alt, oct)
  // if not direction, return a note pitch
  if (!isNum(dir)) return noteArr(pc, o)

  const d = encDir(dir)
  // return the interval
  return ivlPitch(d * pc, d * o, d)
}

// ### Pitch decoding

// remove accidentals to a pitch class
// it gets an array and return a number of fifths
function unaltered (f) {
  const i = (f + 1) % 7
  return i < 0 ? 7 + i : i
}

const decodeStep = (f) => STEPS[unaltered(f)]
const decodeAlt = (f) => Math.floor((f + 1) / 7)
// 'FCGDAEB' steps numbers
const STEPS = [3, 0, 4, 1, 5, 2, 6]
/**
 * Decode a pitch to its numeric properties
 * @param {Pitch}
 * @return {Object}
 */
function decode (p) {
  const s = decodeStep(p[1])
  const a = decodeAlt(p[1])
  const o = isNum(p[2]) ? p[2] + 4 * a + FIFTH_OCTS[s] : null
  return { step: s, alt: a, oct: o, dir: p[3] || null }
}

// #### Pitch parsers

// Convert from string to pitches is a quite expensive operation that it's
// executed a lot of times. Some caching will help:

const cached = (parser) => {
  const cache = {}
  return (str) => {
    if (typeof str !== 'string') return null
    return cache[str] || (cache[str] = parser(str))
  }
}

/**
 * Parse a note name
 * @function
 * @param {String}
 * @return {Pitch}
 */
const parseNote = cached((str) => {
  const n = noteParse(str)
  return n ? encode(n.step, n.alt, n.oct) : null
})

/**
 * Test if the given string is a note name
 * @function
 * @param {String}
 * @return {Boolean}
 */
const isNoteStr = (s) => parseNote(s) !== null

/**
 * Parses an interval name in shorthand notation
 * @function
 * @param {String}
 * @return {Pitch}
 */
const parseIvl = cached((str) => {
  const i = ivlNttn.parse(str)
  return i ? encode(i.simple - 1, i.alt, i.oct, i.dir) : null
})

/**
 * Test if the given string is an interval name
 * @function
 * @param {String}
 * @return {Boolean}
 */
const isIvlPitchStr = (s) => parseIvl(s) !== null


const parsePitch = (str) => parseNote(str) || parseIvl(str)

// ### Pitch to string

/**
 * Given a step number return the letter
 * @function
 * @param {Integer}
 * @return {String}
 */
const toLetter = (s) => 'CDEFGAB'[s % 7]

// Repeat a string num times
const fillStr = (s, num) => Array(Math.abs(num) + 1).join(s)

/**
 * Given an alteration number, return the accidentals
 *
 * @function
 * @param {Integer}
 * @return {String}
 */
const toAcc = (n) => fillStr(n < 0 ? 'b' : '#', n)
const strNum = (n) => n !== null ? n : ''

/**
 * Given a pitch class or a pitch note, get the string in scientific
 * notation
 *
 * @param {Pitch}
 * @return {String}
 */
function strNote (n) {
  const p = isPitch(n) && !n[3] ? decode(n) : null
  return p ? toLetter(p.step) + toAcc(p.alt) + strNum(p.oct) : null
}

// is an interval ascending?
const isAsc = (p) => p.dir === 1
// is an interval perfectable?
const isPerf = (p) => ivlNttn.type(p.step + 1) === 'P'
// calculate interval number
const calcNum = (p) => isAsc(p) ? p.step + 1 + 7 * p.oct : (8 - p.step) - 7 * (p.oct + 1)
// calculate interval alteration
const calcAlt = (p) => isAsc(p) ? p.alt : isPerf(p) ? -p.alt : -(p.alt + 1)

/**
 * Given an interval, get the string in scientific
 * notation
 *
 * @param {Pitch}
 * @return {String}
 */
function strIvl (pitch) {
  const p = isIvlPitch(pitch) ? decode(pitch) : null
  if (!p) return null
  const num = calcNum(p)
  return p.dir * num + ivlNttn.altToQ(num, calcAlt(p))
}

const strPitch = (p) => p[3] ? strIvl(p) : strNote(p)

// #### Decorate pitch transform functions

const notation = (parse, str) => (v) => !isPitch(v) ? parse(v) : str(v)

const asNote = notation(parseNote, id)
const asIvl = notation(parseIvl, id)
const asPitch = notation(parsePitch, id)

const toNoteStr = notation(id, strNote)
const toIvlStr = notation(id, strIvl)
const toPitchStr = notation(id, strPitch)

// create a function decorator to work with pitches
const pitchOp = (parse, to) => (fn) => (v) => {
  // is value in array notation?...
  const isP = isPitch(v)
  // then no transformation is required
  if (isP) return fn(v)
  // else parse the pitch
  const p = parse(v)
  // if parsed, apply function and back to string
  return p ? to(fn(p)) : null
}
const noteFn = pitchOp(parseNote, toNoteStr)
const ivlFn = pitchOp(parseIvl, toIvlStr)
const pitchFn = pitchOp(parsePitch, toPitchStr)

/**
 * Given a string return a note string in scientific notation or null
 * if not valid string
 *
 * @function
 * @param {String}
 * @return {String}
 * @example
 * ['c', 'db3', '2', 'g+', 'gx4'].map(tonal.note)
 * // => ['C', 'Db3', null, null, 'G##4']
 */
const note = noteFn(id)

// #### Pitch properties

/**
 * Get pitch class of a note. The note can be a string or a pitch array.
 *
 * @function
 * @param {String|Pitch}
 * @return {String} the pitch class
 * @example
 * tonal.pc('Db3') // => 'Db'
 */
const pc = noteFn((p) => [ 'tnl', p[1] ])

/**
 * Return the chroma of a pitch.
 *
 * @function
 * @param {String|Pitch}
 * @return {Integer}
 */
const chroma = pitchFn((n) => {
  return 7 * n[1] - 12 * fOcts(n[1])
})

/**
 * Return the letter of a pitch
 *
 * @function
 * @param {String|Pitch}
 * @return {String}
 */
const letter = noteFn((n) => toLetter(decode(n).step))

const accidentals = noteFn((n) => toAcc(decode(n).alt))

const octave = pitchFn((p) => decode(p).oct)

const simplify = ivlFn(function (i) {
  const d = i[3]
  const s = decodeStep(d * i[1])
  const a = decodeAlt(d * i[1])
  return ivlPitch(i[1], -d * (FIFTH_OCTS[s] + 4 * a), d)
})

const simplifyAsc = ivlFn((i) => {
  var s = simplify(i)
  return (s[3] === 1) ? s : ivlPitch(s[1], s[2] + 1, 1)
})

const simpleNum = ivlFn(function (i) {
  const p = decode(i)
  return p.step + 1
})

const number = ivlFn((i) => calcNum(decode(i)))

const quality = ivlFn((i) => {
  const p = decode(i)
  return ivlNttn.altToQ(p.step + 1, p.alt)
})

// __semitones__

// get pitch height
const height = (p) => p[1] * 7 + 12 * p[2]
const semitones = ivlFn(height)

// #### Midi pitch numbers

// The midi note number can have a value between 0-127
// http://www.midikits.net/midi_analyser/midi_note_numbers_for_octaves.htm

/**
 * Test if the given number is a valid midi note number
 * @function
 * @param {Object} num - the number to test
 * @return {Boolean} true if it's a valid midi note number
 */
const isMidi = (m) => isValue(m) && !isArr(m) && m >= 0 && m < 128

// To match the general midi specification where `C4` is 60 we must add 12 to
// `height` function:

/**
 * Get midi number for a pitch
 * @function
 * @param {Array|String} pitch - the pitch
 * @return {Integer} the midi number or null if not valid pitch
 * @example
 * midi('C4') // => 60
 */
const midi = function (val) {
  const p = asNote(val)
  return hasOct(p) ? height(p) + 12
    : isMidi(val) ? +val
    : null
}

const PCS = 'C Db D Eb E F Gb G Ab A Bb B'.split(' ')
/**
 * Given a midi number, returns a note name. The altered notes will have
 * flats.
 * @function
 * @param {Integer} midi - the midi note number
 * @return {String} the note name
 * @example
 * tonal.fromMidi(61) // => 'Db4'
 */
const fromMidi = (m) => {
  const pc = PCS[m % 12]
  const o = Math.floor(m / 12) - 1
  return pc + o
}

// #### Frequency conversions

// The most popular way (in western music) to calculate the frequency of a pitch
// is using the [well
// temperament](https://en.wikipedia.org/wiki/Well_temperament) tempered tuning.
// It assumes the octave to be divided in 12 equally sized semitones and tune
// all the notes against a reference:

/**
 * Get a frequency calculator function that uses well temperament and a tuning reference.
 * @function
 * @param {Float} ref - the tuning reference
 * @return {Function} the frequency calculator. It accepts a pitch in array or scientific notation and returns the frequency in herzs.
 */
const wellTempered = (ref) => (pitch) => {
  const m = midi(pitch)
  return m ? Math.pow(2, (m - 69) / 12) * ref : null
}

// The common tuning reference is `A4 = 440Hz`:

/**
 * Get the frequency of a pitch using well temperament scale and A4 equal to 440Hz
 * @function
 * @param {Array|String} pitch - the pitch to get the frequency from
 * @return {Float} the frequency in herzs
 * @example
 * tonal.freq('C4') // => 261.6255653005986
 */
const freq = wellTempered(440)

// 2. PITCH DISTANCES
// ==================

// ### 2.1 Tansposition

function trBy (i, p) {
  if (p === null) return null
  const f = i[1] + p[1]
  if (p.length === 2) return [ 'tnl', f ]
  const o = i[2] + p[2]
  if (p.length === 3) return [ 'tnl', f, o ]
  return [ 'tnl', f, o, calcDir(f, o) ]
}

/**
 * Transpose notes. Can be used to add intervals
 * @function
 */
function transpose (a, b) {
  if (arguments.length === 1) return (b) => transpose(a, b)
  const pa = asPitch(a)
  const pb = asPitch(b)
  const r = isIvlPitch(pa) ? trBy(pa, pb)
    : isIvlPitch(pb) ? trBy(pb, pa) : null
  return toPitchStr(r)
}

/**
 * Transpose notes. An alias for `transpose`
 * @function
 */
const tr = transpose

// ### 2.2 Distances (in intervals)

// substract two pitches
function substr (a, b) {
  if (a.length !== b.length) return null
  return isPitchClass(a)
    ? ivlPitch(b[1] - a[1], -fOcts(b[1] - a[1]), 1)
    : ivlPitch(b[1] - a[1], b[2] - a[2])
}

/**
 * Find distance between two pitches. Both pitches MUST be of the same type.
 * Distances between pitch classes always returns ascending intervals.
 * Distances between intervals substract one from the other.
 *
 * @param {Pitch|String} from - distance from
 * @param {Pitch|String} to - distance to
 * @return {Interval} the distance between pitches
 * @example
 * var tonal = require('tonal')
 * tonal.distance('C2', 'C3') // => 'P8'
 * tonal.distance('G', 'B') // => 'M3'
 * tonal.distance('M2', 'P5') // => 'P4'
 */
function distance (a, b) {
  if (arguments.length === 1) return (b) => distance(a, b)
  const pa = asPitch(a)
  const pb = asPitch(b)
  const i = substr(pa, pb)
  // if a and b are in array notation, no conversion back
  return a === pa && b === pb ? i : toIvlStr(i)
}

/**
 * An alias for `distance`
 * @function
 */
const dist = distance
/**
 * An alias for `distance`
 * @function
 */
const interval = distance

// ## 3. Lists

// items can be separated by spaces, bars and commas
const SEP = /\s*\|\s*|\s*,\s*|\s+/
/**
 * Split a string by spaces (or commas or bars). Always returns an array, even if its empty
 * @param {String|Array|Object} source - the thing to get an array from
 * @return {Array} the object as an array
 */
function asList (src) {
  return isArr(src) ? src
    : typeof src === 'string' ? src.trim().split(SEP)
    : (src === null || typeof src === 'undefined') ? []
    : [ src ]
}

/**
 * Map a list with a function
 *
 * Can be partially applied.
 *
 * @param {Function}
 * @param {String|Array}
 * @return {Array}
 */
function map (fn, list) {
  return arguments.length > 1 ? map(fn)(list) : (l) => asList(l).map(fn)
}

/**
 * Filter a list with a function
 *
 * Can be partially applied.
 *
 * @param {Function}
 * @param {String|Array}
 * @return {Array}
 */
function filter (fn, list) {
  return arguments.length > 1 ? filter(fn)(list) : (l) => asList(l).filter(fn)
}

// #### Transform lists in array notation

const listToStr = (v) => isPitch(v) ? toPitchStr(v) : isArr(v) ? v.map(toPitchStr) : v

/**
 * Decorates a function to work with lists in pitch array notation
 * @function
 */
const listFn = (fn) => (src) => {
  const param = asList(src).map(asPitch)
  const result = fn(param)
  return listToStr(result)
}

// #### Transpose lists

/**
 * Create an harmonizer: a function that given a note returns a list of notes.
 *
 * @function
 * @param {String|Array} list
 * @return {Function}
 */
const harmonizer = (list) => (pitch) => {
  return listFn((list) => list.map(transpose(pitch || 'P1')).filter(id))(list)
}

/**
 * Harmonizes a list with a pitch
 *
 * @function
 * @param {String|Array} list
 * @param {String|Pitch} pitch
 * @return {Array}
 */
const harmonize = function (list, pitch) {
  return arguments.length > 1 ? harmonizer(list)(pitch) : harmonizer(list)
}

// #### Ranges

// ascending range
const ascR = (b, n) => { for (var a = []; n-- ; a[n] = n + b ); return a; }
// descending range
const descR = (b, n) => { for (var a = []; n-- ; a[n] = b - n ) ; return a; }

/**
 * Create a range. It works with numbers or note names
 * @function
 */
function range (a, b) {
  const ma = isNum(a) ? a : midi(a)
  const mb = isNum(b) ? b : midi(b)
  return ma === null || mb === null ? []
    : ma < mb ? ascR(ma, mb - ma + 1) : descR(ma, ma - mb + 1)
}

/**
 * Create a note range
 * @function
 */
function noteRange (fn, a, b) {
  if (arguments.length === 1) return (a, b) => noteRange(fn, a, b)
  return range(a, b).map(fn).filter((x) => x !== null )
}

/**
 * Create a range of chromatic notes
 * @function
 * @example
 * tonal.chromatic('C2', 'E2') // => ['C2', 'Db2', 'D2', 'Eb2', 'E2']
 */
const chromatic = noteRange(fromMidi)

// #### Cycle of fifths

/**
 * Transpose a tonic a number of perfect fifths.
 * @function
 */
function fifthsFrom (t, n) {
  if (arguments.length > 1) return fifthsFrom(t)(n)
  return (n) => tr(t, ivlPitch(n, 0))
}


// #### Sort lists

const objHeight = function (p) {
  if (!p) return -Infinity
  const f = p[1] * 7
  const o = isNum(p[2]) ? p[2] : -Math.floor(f / 12) - 10
  return f + o * 12
}

const ascComp = (a, b) => objHeight(a) - objHeight(b)
const descComp = (a, b) => -ascComp(a, b)

function sort (comp, list) {
  if (arguments.length > 1) return sort(comp)(list)
  const fn = comp === true || comp === null ? ascComp
    : comp === false ? descComp : comp
  return listFn((arr) => arr.sort(fn))
}

// Fin.

exports.isArr = isArr;
exports.isNum = isNum;
exports.isStr = isStr;
exports.isDef = isDef;
exports.isValue = isValue;
exports.id = id;
exports.pcArr = pcArr;
exports.noteArr = noteArr;
exports.ivlPitch = ivlPitch;
exports.isPitch = isPitch;
exports.isPitchClass = isPitchClass;
exports.hasOct = hasOct;
exports.isNotePitch = isNotePitch;
exports.isIvlPitch = isIvlPitch;
exports.isPitchNotIvl = isPitchNotIvl;
exports.encode = encode;
exports.decode = decode;
exports.parseNote = parseNote;
exports.isNoteStr = isNoteStr;
exports.parseIvl = parseIvl;
exports.isIvlPitchStr = isIvlPitchStr;
exports.toLetter = toLetter;
exports.toAcc = toAcc;
exports.strNote = strNote;
exports.strIvl = strIvl;
exports.note = note;
exports.pc = pc;
exports.chroma = chroma;
exports.letter = letter;
exports.accidentals = accidentals;
exports.octave = octave;
exports.simplify = simplify;
exports.simplifyAsc = simplifyAsc;
exports.simpleNum = simpleNum;
exports.number = number;
exports.quality = quality;
exports.semitones = semitones;
exports.isMidi = isMidi;
exports.midi = midi;
exports.fromMidi = fromMidi;
exports.wellTempered = wellTempered;
exports.freq = freq;
exports.transpose = transpose;
exports.tr = tr;
exports.distance = distance;
exports.dist = dist;
exports.interval = interval;
exports.asList = asList;
exports.map = map;
exports.filter = filter;
exports.listFn = listFn;
exports.harmonizer = harmonizer;
exports.harmonize = harmonize;
exports.range = range;
exports.noteRange = noteRange;
exports.chromatic = chromatic;
exports.fifthsFrom = fifthsFrom;
exports.sort = sort;
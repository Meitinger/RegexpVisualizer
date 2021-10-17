/*
 * Regular Expression Visualizer
 * Copyright (C) 2021  Manuel Meitinger
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as P from "parsimmon"
import { CharSet, NFA } from "refa";

const MaxCharacter = 0xFFFF;

function defineCharSet(s: string): CharSet {
    return CharSet.fromCharacters(MaxCharacter, s.split('').map(c => c.charCodeAt(0)).sort((a, b) => a - b));
}

export const DigitsCharSet = defineCharSet("0123456789");
export const WordCharSet = defineCharSet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_");
export const WhiteSpaceCharSet = defineCharSet("\f\n\r\t\v\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff");

function quantify(nfa: NFA, min: number, max: number): NFA {
    var result = nfa.copy();
    result.quantify(min, max);
    return result;
};

function nfaFromCharSet(charSet: CharSet): NFA {
    const result = NFA.empty({ maxCharacter: charSet.maximum });
    if (!charSet.isEmpty) {
        const nodes = result.nodes;
        const final = nodes.createNode();
        nodes.linkNodes(nodes.initial, final, charSet);
        nodes.makeFinal(final);
    }
    return result;
}

function charSetFromRange(min: number, max: number): CharSet {
    if (min > max) {
        throw new RangeError(
            `The range [min=${min}, max=${max}] is invalid.`
        );
    }
    return CharSet.empty(MaxCharacter).union([{ min, max }]);
}

function charSetFromChar(char: number): CharSet {
    return CharSet.fromCharacters(MaxCharacter, [char]);
}

export const Parser = P.createLanguage<{
    STAR: '*'
    PIPE: '|'
    TILDE: '~'
    PLUS: '+'
    OPTIONAL: '?'
    PARENTH_LEFT: '('
    PARENTH_RIGHT: ')'
    BRACKET_LEFT: '['
    BRACKET_RIGHT: ']'
    CARET: '^'
    DASH: '-'
    DOT: '.'
    NON_META: number
    ESCAPED_META: number
    CLASSES: CharSet
    SPECIAL: number
    SET_NON_META: number
    SET_ESCAPED_META: number

    regex: NFA
    union: NFA
    level3: NFA
    concatenation: NFA
    level2: NFA
    intersection: NFA
    level1: NFA
    star: NFA
    plus: NFA
    optional: NFA
    level0: NFA
    group: NFA
    text: NFA
    char: number
    any: CharSet
    positive_set: CharSet
    negative_set: CharSet
    set: CharSet
    set_concatenation: CharSet
    set_item: CharSet
    set_char: number
    range: CharSet
}>({
    STAR: () => P.string('*'),
    PIPE: () => P.string('|'),
    TILDE: () => P.string('~'),
    PLUS: () => P.string('+'),
    OPTIONAL: () => P.string('?'),
    PARENTH_LEFT: () => P.string('('),
    PARENTH_RIGHT: () => P.string(')'),
    BRACKET_LEFT: () => P.string('['),
    BRACKET_RIGHT: () => P.string(']'),
    CARET: () => P.string('^'),
    DASH: () => P.string('-'),
    DOT: () => P.string('.'),
    NON_META: () => P.regexp(/[^\\(){}[\]|*+?.~]/).map(s => s.charCodeAt(0)),
    ESCAPED_META: () => P.regexp(/\\[\\(){}[\]|*+?.~]/).map(s => s.charCodeAt(1)),
    CLASSES: () => P.regexp(/\\[dDwWsS]/).map(s => {
        switch (s[1]) {
            case 'd': return DigitsCharSet;
            case 'D': return DigitsCharSet.negate();
            case 'w': return WordCharSet;
            case 'W': return WordCharSet.negate();
            case 's': return WhiteSpaceCharSet;
            case 'S': return WhiteSpaceCharSet.negate();
            default: throw new Error(`Class ${s[1]} not implemented.`);
        }
    }),
    SPECIAL: () => P.regexp(/\\([trnvfb0]|u[0-9]{4})/).map(s => {
        switch (s[1]) {
            case 't': return 9;
            case 'r': return 13;
            case 'n': return 10;
            case 'v': return 11;
            case 'b': return 8;
            case '0': return 0;
            case 'u': return parseInt(s.substring(2));
            default: throw new Error(`Special character ${s[1]} not implemented.`);
        }
    }),
    SET_NON_META: () => P.regexp(/[^\\^\-\]]/).map(s => s.charCodeAt(0)),
    SET_ESCAPED_META: () => P.regexp(/\\[\\^\-\]]/).map(s => s.charCodeAt(1)),

    regex: r => P.alt(r.union, r.level3),
    union: r => P.seq(r.level3, r.PIPE, r.regex).map(([left, _, right]) => {
        var result = left.copy();
        result.union(right);
        return result;
    }),
    level3: r => P.alt(r.intersection, r.level2),
    intersection: r => P.seq(r.level2, r.TILDE, r.level3).map(([left, _, right]) => NFA.fromIntersection(left, right)),
    level2: r => P.alt(r.concatenation, r.level1),
    concatenation: r => P.seq(r.level1, r.level2).map(([left, right]) => {
        var result = left.copy();
        result.append(right);
        return result;
    }),
    level1: r => P.alt(r.star, r.plus, r.optional, r.level0),
    star: r => P.seq(r.level0, r.STAR).map(([nfa, _]) => quantify(nfa, 0, Infinity)),
    plus: r => P.seq(r.level0, r.PLUS).map(([nfa, _]) => quantify(nfa, 1, Infinity)),
    optional: r => P.seq(r.level0, r.OPTIONAL).map(([nfa, _]) => quantify(nfa, 0, 1)),
    level0: r => P.alt(r.group, r.text),
    group: r => P.seq(r.PARENTH_LEFT, r.regex, r.PARENTH_RIGHT).map(([_l, nfa, _r]) => nfa),
    text: r => P.alt(r.CLASSES, r.any, r.positive_set, r.negative_set, r.char.map(charSetFromChar)).map(nfaFromCharSet),
    char: r => P.alt(r.NON_META, r.ESCAPED_META, r.SPECIAL),
    any: r => r.DOT.map(_ => CharSet.all(MaxCharacter)),
    positive_set: r => P.seq(r.BRACKET_LEFT, r.set, r.BRACKET_RIGHT).map(([_l, set, _r]) => set),
    negative_set: r => P.seq(r.BRACKET_LEFT, r.CARET, r.set, r.BRACKET_RIGHT).map(([_l, _c, set, _r]) => set.negate()),
    set: r => P.alt(r.set_concatenation, r.set_item),
    set_concatenation: r => P.seq(r.set_item, r.set).map(([left, right]) => left.union(right)),
    set_item: r => P.alt(r.CLASSES, r.range, r.set_char.map(charSetFromChar)),
    set_char: r => P.alt(r.SET_NON_META, r.SET_ESCAPED_META, r.SPECIAL),
    range: r => P.seq(r.set_char, r.DASH, r.set_char).map(([min, _, max]) => charSetFromRange(min, max)),
});

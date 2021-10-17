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

import { useEffect, useState, useRef } from 'react';
import { NFA, CharSet } from 'refa';
import Viz from 'viz.js'
import { DigitsCharSet, WhiteSpaceCharSet, WordCharSet } from './parser';

const Renderer = new (Viz as any)({ workerURL: './static/js/full.render.js' }) as Viz;

const Classes = new Map<string, CharSet>([
    ['\\d', DigitsCharSet],
    ['\\D', DigitsCharSet.negate()],
    ['\\w', WordCharSet],
    ['\\W', WordCharSet.negate()],
    ['\\s', WhiteSpaceCharSet],
    ['\\S', WhiteSpaceCharSet.negate()],
]);

function formatChar(char: number): string {
    switch (char) {
        case 9: return '\t';
        case 13: return '\r';
        case 10: return '\n';
        case 11: return '\v';
        case 8: return '\b';
        case 0: return '\0';
        case 32: return '<space>';
        default: {
            if (char > 126 || char < 32) {
                const number = char.toString(16);
                return `\\u${'0'.repeat(4 - number.length)}${number}`;
            }
            else {
                return String.fromCharCode(char);
            }
        }
    }
}

function formatCharSet(charSet: CharSet): string {
    if (charSet.isAll) {
        return '<any>';
    }
    if (charSet.isEmpty) {
        return '<never>'; // should never occur
    }

    const classes: string[] = []
    while (!charSet.isEmpty) {
        let largest: { name: string, set: CharSet } | undefined
        for (const [name, set] of Classes) {
            if (set.isSubsetOf(charSet)) {
                if (largest) {
                    if (set.size < largest.set.size) {
                        continue;
                    }
                }
                largest = { name, set };
            }
        }
        if (!largest) {
            break;
        }
        classes.push(largest.name);
        charSet = charSet.without(largest.set);
    }

    return classes.concat(charSet.ranges.map(range => range.min === range.max ? formatChar(range.min) : `${formatChar(range.min)}-${formatChar(range.max)}`)).join(',');
}

export const Visualizer = ({ nfa }: { nfa: NFA | null }) => {
    const graphHolder = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(100);
    const [graph, setGraph] = useState(null as SVGSVGElement | null);
    const [error, setError] = useState(undefined as any);

    useEffect(() => {
        let cancel = false;
        setGraph(null);
        setError(undefined);
        if (nfa) {
            Renderer.renderSVGElement(nfa.toDot(formatCharSet))
                .then(element => cancel || setGraph(element))
                .catch(error => cancel || setError(error));
        }
        return () => { cancel = true; };
    }, [nfa]);

    useEffect(() => {
        if (graph) {
            graph.style.transformOrigin = 'top left';
            graph.style.transform = `scale(${scale / 100})`;
        }
    }, [graph, scale]);

    useEffect(() => {
        const div = graphHolder.current;
        if (!div || !graph) {
            return;
        }
        const node = div.appendChild(graph);
        return () => { div.removeChild(node); }
    }, [graphHolder, graph]);

    return (
        <div className="uk-card uk-card-default">
            <div className="uk-card-header">
                <div className="uk-grid-small" data-uk-grid>
                    <div className="uk-width-auto">
                        <h3 className="uk-card-title">Visualization</h3>
                    </div>
                    <div className="uk-width-expand uk-text-right">
                        <div className="uk-button-group">
                            <button disabled={!graph || scale === 100} className="uk-button uk-button-default uk-button-small" onClick={() => setScale(Math.max(scale - 10, 100))}><span data-uk-icon="minus-circle"></span></button>
                            <button disabled={!graph} className="uk-button uk-button-default uk-button-small" onClick={() => setScale(scale + 10)}><span data-uk-icon="plus-circle"></span></button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="uk-card-body">
                <div className={`uk-background-${graph ? 'default' : 'muted'}`} style={{ overflow: 'auto' }} data-uk-height-viewport="expand: true">
                    {error && <span className="uk-text-danger">{error}</span>}
                    {nfa && !(graph || error) && <div className="uk-position-center" data-uk-spinner="ratio: 2"></div>}
                    <div ref={graphHolder}></div>
                </div>
            </div>
        </div>
    );
};

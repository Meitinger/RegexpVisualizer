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

import { render } from "react-dom";
import { Parser } from "./parser";

import { Visualizer } from "./visualizer";
import { useState, useCallback } from "react";
import { NFA } from "refa";

import './uikitloader.js';

const App = () => {
    const [nfa, setNfa] = useState(null as NFA | null);
    const [error, setError] = useState(null as string | null);
    const [text, setText] = useState('');

    function parse(s: string) {
        setNfa(null);
        setError(null);
        if (s) {
            try {
                setNfa(Parser.regex.tryParse(s));
            }
            catch (error) {
                setError(String(error));
            }
        }
    }

    const test = useCallback(
        () => {
            const word = new Array<number>(text.length);
            for (let i = 0; i < text.length; i++) {
                word[i] = text.charCodeAt(i);
            }
            return nfa?.test(word);
        },
        [nfa, text],
    );

    return (
        <>
            <div className="uk-margin-top uk-margin-left uk-margin-right uk-margin-bottom">
                <div className="uk-margin uk-card uk-card-default">
                    <div className="uk-card-header">
                        <div className="uk-grid-small" data-uk-grid>
                            <div className="uk-width-auto">
                                <h3 className="uk-card-title">Regular Expression</h3>
                            </div>
                            <div className="uk-width-expand uk-text-right">
                                <a className="uk-text-primary uk-button uk-button-text" href="https://github.com/Meitinger/regex_viz/blob/main/README.md" target="_blank" rel="noreferrer">Usage</a>
                            </div>
                        </div>
                    </div>
                    <div className="uk-card-body">
                        <div>
                            <div className="uk-grid-small uk-grid-match" data-uk-grid>
                                <div className="uk-width-3-5@m">
                                    <input className={`uk-input ${nfa ? 'uk-form-success' : error ? 'uk-form-danger' : ''}`} type="text" onInput={e => parse(e.currentTarget.value)} />
                                </div>
                                <div className="uk-width-auto@m">
                                    <span className={`uk-text-large uk-text-${nfa ? 'primary' : 'muted'}`}>test</span>
                                </div>
                                <div className="uk-width-expand@m">
                                    <div className="uk-inline">
                                        {test() !== undefined && <span className={`uk-form-icon uk-text-${test() ? 'success' : 'danger'}`} uk-icon={test() ? 'check' : 'close'}></span>}
                                        <input disabled={!nfa} className="uk-input" type="text" value={text} onInput={e => setText(e.currentTarget.value)} />
                                    </div>
                                </div>
                            </div>
                            {error && <span className="uk-text-danger">{error}</span>}
                        </div>
                    </div>
                </div>
                <Visualizer nfa={nfa} />
            </div>
        </>
    );
};

render(<App />, document.getElementById('root'));

# Regular Expression Visualizer

Tiny [React](https://reactjs.org/)+[UIkit](https://getuikit.com/) website written in
[typescript](https://www.typescriptlang.org/) that uses
[parsimmon](https://github.com/jneen/parsimmon) to parse a regular expression,
[refa](https://github.com/RunDevelopment/refa) to build a finite automaton out of the expression and
[viz.js](http://viz-js.com/) to display said automaton.

The site is hosted on [GitHub Pages](https://meitinger.github.io/RegexpVisualizer/),
and built from source using a [GitHub Workflow](https://raw.githubusercontent.com/Meitinger/RegexpVisualizer/main/.github/workflows/gh-pages.yml).

This project was created as part of a master's course in computer science at [UIBK](https://informatik.uibk.ac.at/).


## Usage:

Entered regular expressions can be used to test a string and support the
following syntax (in order of precedence):

```bnf
<regex>         ::= <union> | <intersection> | <concatenation> | <repetition> | <negation> | <group> | <text>
<union>         ::= <regex> "|" <regex>
<intersection>  ::= <regex> "&" <regex>
<concatenation> ::= <regex> <regex>
<repetition>    ::= <regex> ("*" | "+" | "?" | "{" (NUMBER | [NUMBER] "," [NUMBER]) "}")
<negation>      ::= "!" <regex>
<group>         ::= "(" <regex> ")"
<text>          ::= (<range> | <class> | <char> | ".")+
<range>         ::= "[" ["^"] <char> "-" <char> "]"
<class>         ::= "\" ("d" | "D" | "w" | "W" | "s" | "S")
<char>          ::= NON_META | "\" META
```

### Escaping:

`NON_META` and `META` characters depend on the context:

- If used in a `<range>`, the following `META` characters need to be escaped:
  `\`, `^`, `-` and `]`
- If used anywhere else, the following `META` characters need to be escaped:
  `\`, `[`, `(`, `)`, `{`, `}`, `[`, `]`, `|`, `&`, `*`, `+`, `?`, `!` and `.`

All other characters are consider `NON_META`.


### Differences between other RegEx libraries:

There are some small but important differences in the way regular expressions
are validated:

- The regular expression `a|b|` is not considered valid by this parser,
  instead use `(a|b)?`. Same holds for `a||b` or `a~b~`.
- Regular expressions like `[ab^c]` or `ab[c`, where `^` and `[`
  are treated like ordinary characters, are considered invalid.
  Instead use the escaped form, i.e. `[ab\^c]` or `ab\[c`.


### Control Characters and Character Classes:

The following characters can always be entered in escaped form:

- horizontal tab: `\t`
- carriage return: `\r`
- linefeed: `\n`
- vertical tab: `\v`
- form-feed: `\f`
- backspace: `\b`
- NUL character: `\0`
- arbitrary Unicode character: `\uXXXX`, where `XXXX` is a char code from `0000` to `FFFF`


For a description on the available character classes, have a look at the
[MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Character_Classes).
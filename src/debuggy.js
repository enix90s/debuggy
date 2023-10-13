'use strict'

const colorsCode = {
    s: 0, // reset
    h: 1, // bright
    u: 4, // underline,
    k: 5, // blink
    n: 8, // hidden
    // ------------- Foreground
    b: 30, // black
    r: 31, // red
    g: 32, // green
    y: 33, // yellow
    e: 34, // blue
    m: 35, // magenta
    c: 36, // cyan
    w: 37, // white,
    // ------------- Background
    B: 40, // black
    R: 41, // red
    G: 42, // green
    Y: 43, // yellow
    E: 44, // blue
    M: 45, // magenta
    C: 46, // cyan
    W: 47, // white,
}

const color = {}
for(let k in colorsCode) {
    color[k] = `\x1b[${colorsCode[k]}m`
    color[`:${k}`] = `\x1b[${colorsCode[k]+10}m`
}

const repeater = (n, w = ' ') => String(w).repeat(n)

const _tpl = (text, repl = {}) => {
    let keys = Object.keys(colorsCode).join('')
    let re = new RegExp(`\<([${keys}\:]+)\>`, 'g')

    text = text
        .replace('{label}', repl.label || '')
        .replace('{object}', repl.object || '')
        .replace('{line}', repl.line || '')
        .replace('{file}', repl.file || '')
        .replace('{column}', repl.column || '')
        .replace('{datetime}', new Date())

    for(let match of text.matchAll(re)) {
        let ck = match[1].split('').map(item => color[item]).join('')
        text = color.s + text.replace(match[0], color.s + ck)
    }
    return text
}

// Environment
const isSetDebuggy = process.env.DEBUG && process.env.DEBUG.includes('debuggy')
const fakeReturn = () => {}

if(isSetDebuggy) {
    const { group, log, groupEnd } = console
    group(``)
    log(_tpl(
        `<E>${repeater(34)}<s>\n` +
        `<Ehr>   <Ehy>deBuggy<s><Ehw> is starting here....   <s>\n` +
        `<E>${repeater(34)}<s>\n`
    ))
    groupEnd()
}

// Fake debug timer, not recomended. See: example.js
const Timer = new class {

    #start;

    constructor() {
        this.#start = performance.now()
    }
    begin() {
        this.#start = performance.now()
    }
    end(label) {
        let finish = performance.now()
        let ts = (finish - this.#start).toFixed(2)
        if(label) {
            return _tpl((label || '') + ts + 'ms' + (label ? '<s>' : ''))
        }
        return ts
    }    
}

function Debuggy() {

    this.version = '1.0.0-dev'
    this.data = {}

    this._options = {
        shows: '',
        templateActive: '',
    }

    this.options = (options) => {
        this._options.shows = options.shows || ''
        this._options.templates = options.templates || {}
        this._options.templateActive = options.templateActive
    }

    this.debug = (label = 'deBuggy', mode, template) => {
        if(!!!isSetDebuggy) { return fakeReturn }

        this.mode = mode
        this.label = label

        if(typeof mode === 'string') {
            template = mode
        }

		this.template = template || this._options.templateActive

        let exec = /^\[(?<prefix>[A-Z\_\-]+)\](|[\ ]+)(.+)/i.exec(label) || {groups:{}}
        let prefix = exec?.groups?.prefix || null
        let shows = []

        if(String(this._options.shows).trim().length > 0) {
            shows = String(this._options.shows).trim().split(/[\|\,\.\ ](|\ {1,})/g).map(i => i.trim())
        }

        if(shows.length > 0 && !!!shows.includes(prefix)) return fakeReturn

        label = label.replace(`[${prefix}]`, '').trim()

        let keys = Object.keys(colorsCode).join('')
        let re = new RegExp(`\<([${keys}\:]+)\>`, 'g')
        label = re.test(label) ? label : `<he>${label}<s>`
		
        try{
            throw new Error('[DEBUGGY] ' + label.replace(/\<[\w]+\>/ig, '').trim())
        }
        catch(error){
            const stacks = error.stack.split(/\n/g)
                .map(i => i.trim().replace(/^at\ /i, ''))
                .filter(i => !!!i.includes('Debuggy.debug '))
                .slice(0, 2)

			const stackInfo = stacks[1].split(' ')
            stackInfo.reverse()
			const stackedArray = stackInfo[0].replace(/(^\()|(\)$)/g, '').split(':')
			const [ fileName, lineNumber, columnNumber ] = stackedArray
			const stacked = {
				columnNumber,
				functionName: stackInfo[1],
				fileName,
				lineNumber,
			}

			this.data = {
                line    : Number(stacked.lineNumber),
                file    : stacked.fileName.replace(process.cwd(), ''), // makes filepath shortness
                object  : stacked.functionName || 'N/A', // wrapper
                column  : Number(stacked.columnNumber), // not needed.
                label,
            }

        }
        return this.debugShow
    }

    this.debugShow = (...args) => {

        // BunJS doesn't support ``console.table()``
        const { log: _log, count: _count, group: _group, groupEnd: _groupEnd, table: _table } = console

        const data = this.data
		const mode = this.mode
        const { templates } = this._options
		let template = this.template

        const oLabel = data.label
        let label = data.label
            .replace(/\%[\w]/ig, '')
            .trim()

        let replacer = {...data, label}
        const countLabel = '<hg>Count  <s>'

        const tmpl = (arg) => {
            if(oLabel.includes('%j')) {
                arg = JSON.stringify(arg)
                Timer.begin()
                _log(arg)
            
            } else if(oLabel.includes('%t')) {
                Timer.begin()
                _table(arg)
            
            } else {
                Timer.begin()
                _log(arg)
            }

            _log(Timer.end(label))
        }

        const templateAll = templates?.[template]?.all

        if( templateAll && typeof templateAll === 'function' ) {
            templateAll({
                template: _tpl,
                tokens: replacer,
                label: data.label,
                countLabel,
                mode,
            }, args, data)

            return
        }

        const templateHead = templates?.[template]?.head
        // Custom template header:
        if( templateHead && typeof templateHead === 'function' ) {
            templateHead({
                template: _tpl,
                tokens: replacer,
                label: data.label,
                countLabel,
                mode,
            }, args)
        
        } else { // Default template header:
            _log(_tpl(`<hy>########## <s><h>{label}`, replacer))
            _group()
            _log(_tpl(`<hg>Object<s> : <hc>{object}`, replacer))
            _log(_tpl(`<hg>File<s>   : <hm>{file}`, replacer))
            _log(_tpl(`<hg>Line<s>   : <hw>{line}<s>`, replacer))
            _count(_tpl(countLabel))
            _log(_tpl(`<hg>-------<s>: <h><{datetime}><s>`))
            _groupEnd()
        }

        label = _tpl(`<hw>${repeater(7,'~')}: <s><hy>`)
        const templateBody = templates?.[template]?.body

        // Custom template body:
        if( templateBody && typeof templateBody === 'function' ) {
            templateBody(args, {
                template: _tpl, 
                tokens: replacer,
                label: data.label,
                countLabel,
                mode,
            })
            return;
        }

        // Default template body:
        if(Array.isArray(mode) && mode.length == args.length ) {
            for(let i=0; i<args.length; i++) {
                _group()
                _log(_tpl(`<gh>#<hy> ${mode[i]}<s>:`))
                if(mode[i].includes('%j')) {
                    Timer.begin()
                    _log(JSON.stringify(args[i]))
                    _groupEnd()
                
                } else if(mode[i].includes('%t')) {
                    Timer.begin()
                    _table(args[i])
                    _groupEnd()
                
                } else {
                    Timer.begin()
                    _log(args[i])
                }

                _log(Timer.end(label))
                _groupEnd()
            }
            _log(``)
            return;
        }

        if(oLabel.includes('%t')) {
            let i = 1
            for(let arg of args) {
                let typ = typeof arg
                let warn = !!!(arg == null || typ === 'string' || arg == undefined || typ === 'number') ? '' : `Not a table: ${typ}`
                _group()
                _log(_tpl(`<hg># <s><hy>Table ${i}<s>: <hr>${warn}<s>`))
                Timer.begin()
                _table(arg)
                _log(Timer.end(label))
                _groupEnd()
                i++
            }
        
        } else if(oLabel.includes('%g')) {
            let i = 1
            for(let arg of args) {
                _group()
                _log(_tpl(`<gh># <hy>Group ${i}<s>:`))
                tmpl(arg)
                _groupEnd()
                i++
            }

        } else if(oLabel.includes('%j')) {
            Timer.begin()
            _group()
            _log(JSON.stringify(args[0]))
            _log(Timer.end(label))
            _groupEnd()

        } else {
            let i = 0;
            for(let arg of args) {
                _group()
                tmpl(arg)
                i++
                _groupEnd()
            }
        }
        // process.stdout.write(label, ms)
        _log(``)
    }
}

module.exports = Debuggy;

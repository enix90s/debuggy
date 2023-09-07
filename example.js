'use strict'

const Debuggy = require('./src/index')

// Simple

const debug = Debuggy.debug

debug()('Hello!')
debug('Hello')('Hello world!')

let data = {
    say: 'Hello world!',
}

debug('Hello Foo')({
    say: 'Hello Foo!',
})

function SayHello(data) {
    debug('Hello')(data)
}

SayHello(data)
SayHello(data)
SayHello(data)
SayHello(data)

data = {
    name: 'John',
    fullname: 'John Foo',
    gender: 'Male',
}

debug('Identity')(data)
debug('Identity %t')(data)
debug('Identity %j')(data)

let skills = ['css', 'js', 'node', 'typescript']

debug('Information', ['Data', 'Skills'])(data, skills)

debug('<hm>More Information')({
    data,
    skills,
})

// With options, shows/hidden

Debuggy.options({
    shows: 'APP|FN'
})

const debuggy = Debuggy.debug

debuggy('[APP] Identity')(data)
debuggy('[FN] <hr>Identity %t')(data)

debuggy('Identity %j')(data) // Hidden

Debuggy.options({
    templateActive: 'simple',
    templates: {
        simple: {
            head: ({template, tokens}) => {
                console.log(template(`########## <hr>{label}<s>`, tokens))
            }
        }
    }
})

const buggy = Debuggy.debug

buggy('[TPL] Hello Template')(data)
buggy('[TPL] Hello Template', 'simple')(data)

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const glob = require('glob');
const codeBlocks = require('gfm-code-blocks');
const { HtmlValidate } = require('html-validate');

// Run this from the base directory of the repository.
const repositoryRoot = process.cwd();

const pattern = path.join(repositoryRoot, 'website_docs', '**', '*.md');

const htmlvalidate = new HtmlValidate();


console.log(pattern)

glob(pattern, {}, function (er, files) {
    if(er) {
        throw er;
    }
    files.forEach(file => {    
        fs.readFile(file, 'utf8' , (err, data) => {
            if (err) {
                throw err;
            }
            const blocks = codeBlocks(data);
            blocks.forEach(block => {
                console.log(`Checking ${block.lang} code in file ${path.basename(file)} line ${block.start} ... ${block.end}.`)
                if(block.lang === 'javascript') {
                    if(block.code.includes('import')) {
                        const script = new vm.SourceTextModule(block.code);
                    } else {
                        const script = new vm.Script(block.code);
                    }
                    console.log('`- Success')
                } else if(block.lang === 'json') {
                    JSON.parse(block.code)
                    console.log('`- Success')
                } else if(block.lang === 'html') {
                    htmlvalidate.validateString(block.code)
                } else {
                    console.log('`- Skipped')
                }
            })
        })
    })    
})
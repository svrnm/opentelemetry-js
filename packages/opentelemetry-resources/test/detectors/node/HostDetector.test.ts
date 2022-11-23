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

import * as sinon from 'sinon';
import * as assert from 'assert';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { describeNode } from '../../util';
import { hostDetector, Resource } from '../../../src';
import { HostDetector } from '../../../src';

describeNode('hostDetector() on Node.js', () => {
  let readStub;

  afterEach(() => {
    sinon.restore();
  });

  it('should return resource information about the host', async () => {
    const os = require('os');

    sinon.stub(os, 'arch').returns('x64');
    sinon.stub(os, 'hostname').returns('opentelemetry-test');

    readStub = sinon
      .stub(HostDetector, 'readFileAsync' as any)
      .resolves('fdbf79e8af94cb7f9e8df36789187052');

    const resource: Resource = await hostDetector.detect();

    assert.strictEqual(
      resource.attributes[SemanticResourceAttributes.HOST_NAME],
      'opentelemetry-test'
    );
    assert.strictEqual(
      resource.attributes[SemanticResourceAttributes.HOST_ARCH],
      'amd64'
    );
    assert.strictEqual(
      resource.attributes[SemanticResourceAttributes.HOST_ID],
      'fdbf79e8af94cb7f9e8df36789187052'
    );
  });

  it('should pass through arch string if unknown', async () => {
    const os = require('os');

    sinon.stub(os, 'arch').returns('some-unknown-arch');

    const resource: Resource = await hostDetector.detect();

    assert.strictEqual(
      resource.attributes[SemanticResourceAttributes.HOST_ARCH],
      'some-unknown-arch'
    );
  });

  it('should check two files for host id', async () => {
    readStub = sinon.stub(HostDetector, 'readFileAsync' as any);

    readStub.onFirstCall().resolves('');
    readStub.onSecondCall().resolves('fdbf79e8af94cb7f9e8df36789187052');

    const resource: Resource = await hostDetector.detect();

    sinon.assert.calledTwice(readStub);

    assert.strictEqual(
      resource.attributes[SemanticResourceAttributes.HOST_ID],
      'fdbf79e8af94cb7f9e8df36789187052'
    );
  });

  it('should not set host id if not available', async () => {
    readStub = sinon.stub(HostDetector, 'readFileAsync' as any);

    readStub.onFirstCall().resolves('');
    readStub.onSecondCall().resolves('');

    const resource: Resource = await hostDetector.detect();

    sinon.assert.calledTwice(readStub);

    assert.strictEqual(
      resource.attributes[SemanticResourceAttributes.HOST_ID],
      undefined
    );
  });
});

import test from 'ava';
import fs from 'fs';
import sinon from 'sinon';

import { writeFile } from '../../../utils-test/file';

import { generateCommand } from './index';
import { repeat } from './helpers';
import { processCommandFile } from '../analysis';

const TEST_FILE_COMMAND_GENERATED = './temp/file-command-generated/.workflow';

test.before('process file command generated', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED, `cp /test3 /test4\ncp /test4 /test5\nmv /test7 /test8 --force`));

test('process file command generated', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED).then(actions => {

    const cp = sinon.spy();
    const mv = sinon.spy();

    const libExternal = {
      cp,
      mv,
    };

    const execute = generateCommand(actions, {
      libExternal
    });

    return execute().then(() => {
      t.true(cp.firstCall.calledWith({}, '/test3', '/test4'));
      t.true(cp.secondCall.calledWith({}, '/test4', '/test5'));
      t.true(mv.calledWith({force: true}, '/test7', '/test8'));
    });
  });
});

test.after('process file command generated', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED);
});


const TEST_FILE_COMMAND_GENERATED_RESULT = './temp/file-command-generated-result/.workflow';

test.before('process file command generated with result', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED_RESULT, `
    $result = cp /test3 /test4
    cp /test4 /test5
    mv /test7 /test8 --force
  `));

test('process file command generated with result', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED_RESULT).then(actions => {

    let store = {};

    const object = { 
      method: () => 'teste',
      setStore: (name, value) => store[name] = value,
      getStore: (name) => store[name],
    };

    const cp = sinon.spy(object, 'method');
    const mv = sinon.spy();
    
    const setStore = sinon.spy(object, 'setStore');
    const getStore = sinon.spy(object, 'getStore');

    const libExternal = {
      cp,
      mv,
    };

    const execute = generateCommand(actions, {
      libExternal,
      store: {
       setStore,
       getStore, 
      },
    });

    return execute().then(() => {
      t.true(cp.firstCall.returned('teste'));
      t.true(setStore.calledWith('$result', 'teste'));
      t.is(store.$result, 'teste');
      t.true(cp.firstCall.calledWith({__hasReturn: true}, '/test3', '/test4'));
      t.true(cp.secondCall.calledWith({}, '/test4', '/test5'));
      t.true(mv.calledWith({force: true}, '/test7', '/test8'));
    });
  });
});

test.after('process file command generated with result', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED_RESULT);
});

const TEST_FILE_COMMAND_GENERATED_RESULT_2 = './temp/file-command-generated-result-2/.workflow';

test.before('process file command generated with result 2', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED_RESULT_2, `
    $result = cp /test3 /test4
    cp /test4 /test5 --opt=$result
    mv /test7 $result --force
  `));

test('process file command generated with result 2', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED_RESULT_2).then(actions => {

    let store = {};

    const object = { 
      method: (opts, orig, dest) => {
        return dest;
      },
      setStore: (name, value) => store[name] = value,
      getStore: (name) => store[name],
    };

    const cp = sinon.spy(object, 'method');
    const mv = sinon.spy();
    
    const setStore = sinon.spy(object, 'setStore');
    const getStore = sinon.spy(object, 'getStore');

    const libExternal = {
      cp,
      mv,
    };

    const execute = generateCommand(actions, {
      libExternal,
      store: {
       setStore,
       getStore, 
      },
    });

    return execute().then(() => {
      t.true(cp.firstCall.returned('/test4'));
      t.true(cp.secondCall.returned('/test5'));
      t.true(cp.secondCall.calledWith({opt: '/test4'}, '/test4', '/test5'));
      t.true(mv.calledWith({force: true}, '/test7', '/test4'));
    });
  });
});

test.after('process file command generated with result 2', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED_RESULT_2);
});

const TEST_FILE_COMMAND_GENERATED_RESULT_3 = './temp/file-command-generated-result-3/.workflow';

test.before('process file command generated with result 3', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED_RESULT_3, `
    $fetch = fetch {
      $otherFunction = otherFunction $fetch {
        otherFunctionSub $otherFunction
      }
    }
    $result = cp /test3 /test4
    cp /test4 /test5 --opt=$result
    mv /test7 $result --force
  `));

test('process file command generated with result 3', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED_RESULT_3).then(actions => {

    let store = {};

    const object = { 
      method: (opts, orig, dest) => {
        return dest;
      },
      setStore: (name, value) => store[name] = value,
      getStore: (name) => store[name],
      fetch: () => 'fetch_test',
      otherFunction: () => 'otherFunction_test',
    };

    const cp = sinon.spy(object, 'method');
    const mv = sinon.spy();
    const fetch = sinon.spy(object, 'fetch');
    const otherFunction = sinon.spy(object, 'otherFunction');
    const otherFunctionSub = sinon.spy();
    
    const setStore = sinon.spy(object, 'setStore');
    const getStore = sinon.spy(object, 'getStore');

    const libExternal = {
      cp,
      mv,
      fetch,
      otherFunction,
      otherFunctionSub,
    };

    const execute = generateCommand(actions, {
      libExternal,
      store: {
       setStore,
       getStore, 
      },
    });

    return execute().then(() => {
      t.true(cp.firstCall.returned('/test4'));
      t.true(cp.secondCall.returned('/test5'));
      t.true(cp.secondCall.calledWith({opt: '/test4'}, '/test4', '/test5'));
      t.true(mv.calledWith({force: true}, '/test7', '/test4'));
      t.true(fetch.returned('fetch_test'));
      t.true(otherFunction.calledWith({__hasReturn: true}, 'fetch_test'));
      t.true(otherFunctionSub.calledWith({}, 'otherFunction_test') );
    });
  });
});

test.after('process file command generated with result 3', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED_RESULT_3);
});

const TEST_PROCESS_FILE_COMMAND_WITH_SUB_COMMAND = './temp/file-process-command-with-sub-command/.workflow';

test.before('process file command with sub command', () =>
  writeFile(TEST_PROCESS_FILE_COMMAND_WITH_SUB_COMMAND, `
    cp /test3 /test4
    cp /test4 /test5
    mv /test7 /test8 --force
    watch /test10 {
      mkdir /test8
    }
  `));

test('process file command with sub command', t => {
  return processCommandFile(TEST_PROCESS_FILE_COMMAND_WITH_SUB_COMMAND).then(actions => {
    const resultObject = [
      {
        command: 'cp',
        args: ['/test3', '/test4'],
        options: {},
        line: 2,
        nextLine: 3,
        commands: [],
        setVariables: undefined,
      },
      {
        command: 'cp',
        args: ['/test4', '/test5'],
        line: 3,
        nextLine: 4,
        options: {},
        commands: [],
        setVariables: undefined,
      },
      {
        command: 'mv',
        args: ['/test7', '/test8'],
        line: 4,
        nextLine: 5,
        options: {
          force: true,
        },
        commands: [],
        setVariables: undefined,
      },
      {
        command: 'watch',
        args: ['/test10'],
        options: {},
        line: 5,
        nextLine: 8,
        commands: [{
          command: 'mkdir',
          args: ['/test8'],
          options: {},
          line: 6,
          nextLine: 7,
          commands: [],
          setVariables: undefined,
        }],
        setVariables: undefined,
      },
    ];

    t.deepEqual(actions, resultObject);
  });
});

test.after('process file command with sub command', () => {
  fs.unlink(TEST_PROCESS_FILE_COMMAND_WITH_SUB_COMMAND);
});

const TEST_FILE_COMMAND_GENERATED_RESULT_WITH_ASYNC = './temp/file-command-generated-result-with-async/.workflow';

test.before('process file command generated with async', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED_RESULT_WITH_ASYNC, `
    $resultFetch = fetch http://teste.com.br --async {
      touch /test/result $resultFetch
      $resultFetch4 = fetch2 http://teste5.com.br --async {
        cp /teste $resultFetch4
      }
    }

    $resultFetch2 = fetch2 http://teste.com.br --async {
      cp /test/result $resultFetch2 $resultFetch
      $resultFetch3 = fetch http://teste2.com.br --async {
        touch /teste $resultFetch3
      }
    }
  `));

test('process file command generated with async', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED_RESULT_WITH_ASYNC).then(actions => {

    let store = {};

    const object = { 
      setStore: (name, value) => store[name] = value,
      getStore: (name) => store[name],
      fetch: () => new Promise(resolve => {
        setTimeout(() => {
          resolve('fetch_test');
        }, 1000);
      }),
      fetch2: () => new Promise(resolve => {
        setTimeout(() => {
          resolve('fetch_test2');
        }, 500);
      }),
    };

    const fetch = sinon.spy(object, 'fetch');
    const fetch2 = sinon.spy(object, 'fetch2');
    const touch = sinon.spy();
    const cp = sinon.spy();
    
    const setStore = sinon.spy(object, 'setStore');
    const getStore = sinon.spy(object, 'getStore');

    const libExternal = {
      fetch,
      fetch2,
      touch,
      cp,
    };

    const execute = generateCommand(actions, {
      libExternal,
      store: {
       setStore,
       getStore, 
      },
    });

    return execute().then(() => {
      t.false(touch.threw());
      t.false(cp.threw());
      t.true(touch.firstCall.calledWith({}, '/test/result', 'fetch_test'));
      t.true(cp.firstCall.calledWith({}, '/test/result', 'fetch_test2', undefined));
    });
  });
});

test.after('process file command generated with async', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED_RESULT_WITH_ASYNC);
});


const TEST_FILE_COMMAND_GENERATED_REPEAT = './temp/file-command-generated-repeat/.workflow';

test.before('process file command generated repeat', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED_REPEAT, `
    $item = each 1 2 3 {
      log $item
    }
  `));

test('process file command generated repeat', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED_REPEAT).then(actions => {

    const store = {};

    const object = {
      each: (opts, ...items) => repeat(items),
    };

    const each = sinon.spy(object, 'each');
    const log = sinon.spy();

    const libExternal = {
      each,
      log,
    };

    const execute = generateCommand(actions, {
      libExternal,
      store: {
        setStore: (name, value) => {
          store[name] = value;
        },
        getStore: (name) => store[name],
      },
    });

    return execute().then(() => {
      t.true(log.firstCall.calledWith({}, 1));
      t.true(log.secondCall.calledWith({}, 2));
      t.true(log.thirdCall.calledWith({}, 3));
    });
  });
});

test.after('process file command generated repeat', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED_REPEAT);
});

const TEST_FILE_COMMAND_GENERATED_REPEAT_WITH_CALLBACK = './temp/file-command-generated-repeat-with-callback/.workflow';

test.before('process file command generated repeat with callback', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED_REPEAT_WITH_CALLBACK, `
    $item = each 1 2 3 {
      log $item
    }
  `));

test('process file command generated repeat with callback', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED_REPEAT_WITH_CALLBACK).then(actions => {

    const store = {};

    const object = {
      each: (opts, ...items) => repeat(items, (i) => i + 1),
    };

    const each = sinon.spy(object, 'each');
    const log = sinon.spy();

    const libExternal = {
      each,
      log,
    };

    const execute = generateCommand(actions, {
      libExternal,
      store: {
        setStore: (name, value) => {
          store[name] = value;
        },
        getStore: (name) => store[name],
      },
    });

    return execute().then(() => {
      t.true(log.firstCall.calledWith({}, 2));
      t.true(log.secondCall.calledWith({}, 3));
      t.true(log.thirdCall.calledWith({}, 4));
    });
  });
});

test.after('process file command generated repeat with callback', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED_REPEAT_WITH_CALLBACK);
});

const TEST_FILE_COMMAND_GENERATED_REPEAT_MULTIPLE_SUBCOMANDS = './temp/file-command-generated-repeat-multiple-subcomands/.workflow';

test.before('process file command generated repeat with multiple subcomands', () =>
  writeFile(TEST_FILE_COMMAND_GENERATED_REPEAT_MULTIPLE_SUBCOMANDS, `
    $item = each 1 2 3 {
      $sum = sum $item 3
      log $sum
    }
  `));

test('process file command generated repeat with multiple subcomands', t => {
  return processCommandFile(TEST_FILE_COMMAND_GENERATED_REPEAT_MULTIPLE_SUBCOMANDS).then(actions => {

    const store = {};

    const object = {
      each: (opts, ...items) => repeat(items, (i) => i + 1),
      sum: (opts, value1, value2) => value1 + value2,
    };

    const each = sinon.spy(object, 'each');
    const log = sinon.spy();
    const sum = sinon.spy(object, 'sum');

    const libExternal = {
      each,
      log,
      sum,
    };

    const execute = generateCommand(actions, {
      libExternal,
      store: {
        setStore: (name, value) => {
          store[name] = value;
        },
        getStore: (name) => store[name],
      },
    });

    return execute().then(() => {
      t.true(log.firstCall.calledWith({}, 5));
      t.true(log.secondCall.calledWith({}, 6));
      t.true(log.thirdCall.calledWith({}, 7));
      t.is(log.callCount, 3);
    });
  });
});

test.after('process file command generated repeat with multiple subcomands', () => {
  fs.unlink(TEST_FILE_COMMAND_GENERATED_REPEAT_MULTIPLE_SUBCOMANDS);
});
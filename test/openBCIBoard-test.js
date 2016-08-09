var sinon = require('sinon'),
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    openBCIBoard = require('../openBCIBoard'),
    openBCISample = openBCIBoard.OpenBCISample,
    k = openBCISample.k,
    chaiAsPromised = require("chai-as-promised"),
    sinonChai = require("sinon-chai"),
    bufferEqual = require('buffer-equal'),
    fs = require('fs'),
    math = require('mathjs');

chai.use(chaiAsPromised);
chai.use(sinonChai);


describe('openbci-sdk',function() {
    this.timeout(2000);
    var ourBoard, masterPortName, realBoard, spy;

    before(function(done) {
        ourBoard = new openBCIBoard.OpenBCIBoard();
        ourBoard.autoFindOpenBCIBoard()
            .then(portName => {
                ourBoard = null;
                realBoard = true;
                masterPortName = portName;
                done();
            })
            .catch(err => {
                ourBoard = null;
                realBoard = false;
                masterPortName = k.OBCISimulatorPortName;
                done();
            })
    });
    after(done => {
        if (ourBoard) {
            if(ourBoard["connected"]) {
                ourBoard.disconnect()
                    .then(() => {
                        done();
                    })
                    .catch(err => {
                        done(err);
                    })
            } else {
                done();
            }
        } else {
            done();
        }
    });
    describe('#constructor', function () {
        afterEach(() => {
            ourBoard = null;
        });
        it('constructs with require', function() {
            var OpenBCIBoard = require('../openBCIBoard').OpenBCIBoard;
            ourBoard = new OpenBCIBoard({
                verbose:true
            });
            expect(ourBoard.numberOfChannels()).to.equal(8);
        });
        it('constructs with the correct default options', () => {
            var board = new openBCIBoard.OpenBCIBoard();
            expect(board.options.boardType).to.equal(k.OBCIBoardDefault);
            expect(board.options.baudRate).to.equal(115200);
            expect(board.options.simulate).to.be.false;
            expect(board.options.simulatorBoardFailure).to.be.false;
            expect(board.options.simulatorDaisyModuleAttached).to.be.false;
            expect(board.options.simulatorFirmwareVersion).to.equal(k.OBCIFirmwareV1);
            expect(board.options.simulatorHasAccelerometer).to.be.true;
            expect(board.options.simulatorInternalClockDrift).to.equal(0);
            expect(board.options.simulatorInjectAlpha).to.be.true;
            expect(board.options.simulatorInjectLineNoise).to.equal(k.OBCISimulatorLineNoiseHz60);
            expect(board.options.simulatorSampleRate).to.equal(k.OBCISampleRate250);
            expect(board.options.simulatorSerialPortFailure).to.be.false;
            expect(board.options.sntpTimeSync).to.be.false;
            expect(board.options.sntpTimeSyncHost).to.equal('pool.ntp.org');
            expect(board.options.verbose).to.be.false;
            expect(board.sampleRate()).to.equal(250);
            expect(board.numberOfChannels()).to.equal(8);
        });
        it('should be able to set ganglion mode', () => {
            var board = new openBCIBoard.OpenBCIBoard({
                boardType: 'ganglion'
            });
            (board.options.boardType).should.equal('ganglion');
        });
        it('should be able to set set daisy mode', () => {
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                boardType: 'daisy'
            });
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                boardtype: 'daisy'
            });
            (ourBoard1.options.boardType).should.equal('daisy');
            (ourBoard2.options.boardType).should.equal('daisy');
            it('should get value for daisy',() => {
                ourBoard1.sampleRate().should.equal(125);
            });
            it('should get value for daisy',() => {
                ourBoard1.numberOfChannels().should.equal(16);
            });
        });
        it('should be able to change baud rate', () => {
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                baudRate: 9600
            });
            (ourBoard1.options.baudRate).should.equal(9600);
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                baudrate: 9600
            });
            (ourBoard2.options.baudRate).should.equal(9600);
        });
        it('should be able to enter simulate mode from the constructor', () =>{
            var board = new openBCIBoard.OpenBCIBoard({
                simulate: true
            });
            expect(board.options.simulate).to.be.true;
        });
        it('should be able to set the simulator to board failure mode', () =>{
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorBoardFailure: true
            });
            expect(ourBoard1.options.simulatorBoardFailure).to.be.true;
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorboardfailure: true
            });
            expect(ourBoard2.options.simulatorBoardFailure).to.be.true;
        });
        it('should be able to attach the daisy board in the simulator', () =>{
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorDaisyModuleAttached: true
            });
            expect(ourBoard1.options.simulatorDaisyModuleAttached).to.be.true;
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatordaisymoduleattached: true
            });
            expect(ourBoard2.options.simulatorDaisyModuleAttached).to.be.true;
        });
        it('should be able to start the simulator with firmware version 2', () =>{
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorFirmwareVersion: 'v2'
            });
            (ourBoard1.options.simulatorFirmwareVersion).should.equal(k.OBCIFirmwareV2);
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorfirmwareversion: 'v2'
            });
            (ourBoard2.options.simulatorFirmwareVersion).should.equal(k.OBCIFirmwareV2);
        });
        it('should be able to put the simulator in raw aux mode', () =>{
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorHasAccelerometer: false
            });
            expect(ourBoard1.options.simulatorHasAccelerometer).to.be.false;
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorhasaccelerometer: false
            });
            expect(ourBoard2.options.simulatorHasAccelerometer).to.be.false;
        });
        it('should be able to make the internal clock of the simulator run slow', () =>{
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorInternalClockDrift: -1
            });
            expect(ourBoard1.options.simulatorInternalClockDrift).to.be.lessThan(0);
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorinternalclockdrift: -1
            });
            expect(ourBoard2.options.simulatorInternalClockDrift).to.be.lessThan(0);
        });
        it('should be able to make the internal clock of the simulator run fast', () =>{
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorInternalClockDrift: 1
            });
            expect(ourBoard1.options.simulatorInternalClockDrift).to.be.greaterThan(0);
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorinternalclockdrift: 1
            });
            expect(ourBoard2.options.simulatorInternalClockDrift).to.be.greaterThan(0);
        });
        it('should be able to not inject alpha waves into the simulator', function() {
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorInjectAlpha: false
            });
            expect(ourBoard1.options.simulatorInjectAlpha).to.be.false;
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorinjectalpha: false
            });
            expect(ourBoard2.options.simulatorInjectAlpha).to.be.false;
        });
        it('can turn 50Hz line noise on', function() {
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorInjectLineNoise: '50Hz'
            });
            expect(ourBoard1.options.simulatorInjectLineNoise).to.equal(k.OBCISimulatorLineNoiseHz50);
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorinjectlinenoise: '50Hz'
            });
            expect(ourBoard2.options.simulatorInjectLineNoise).to.equal(k.OBCISimulatorLineNoiseHz50);
        });
        it('can turn no line noise on', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                simulatorInjectLineNoise: 'None'
            });
            (ourBoard.options.simulatorInjectLineNoise).should.equal(k.OBCISimulatorLineNoiseNone);
        });
        it('defaults to 60Hz line noise when bad input', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                simulatorInjectLineNoise: '20Hz'
            });
            (ourBoard.options.simulatorInjectLineNoise).should.equal(k.OBCISimulatorLineNoiseHz60);
        });
        it('can enter simulate mode with different sample rate', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                simulate: true,
                simulatorSampleRate: 69
            });
            (ourBoard.options.simulate).should.equal(true);
            (ourBoard.options.simulatorSampleRate).should.equal(69);
            (ourBoard.sampleRate()).should.equal(69);
        });
        it('should be able to attach the daisy board in the simulator', () =>{
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                simulatorSerialPortFailure: true
            });
            expect(ourBoard1.options.simulatorSerialPortFailure).to.be.true;
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                simulatorserialportfailure: true
            });
            expect(ourBoard2.options.simulatorSerialPortFailure).to.be.true;
        });
        it('should be able to enter sync mode', function() {
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                sntpTimeSync: true
            });
            expect(ourBoard1.options.sntpTimeSync).to.be.true;
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                sntptimesync: true
            });
            expect(ourBoard2.options.sntpTimeSync).to.be.true;
        });
        it('should be able to change the ntp pool host', function() {
            var expectedPoolName = 'time.apple.com';
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                sntpTimeSyncHost: expectedPoolName
            });
            expect(ourBoard1.options.sntpTimeSyncHost).to.equal(expectedPoolName);
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                sntptimesynchost: expectedPoolName
            });
            expect(ourBoard2.options.sntpTimeSyncHost).to.equal(expectedPoolName);
        });
        it('should be able to change the ntp pool port', function() {
            var expectedPortNumber = 73;
            var ourBoard1 = new openBCIBoard.OpenBCIBoard({
                sntpTimeSyncPort: expectedPortNumber
            });
            expect(ourBoard1.options.sntpTimeSyncPort).to.equal(expectedPortNumber);
            // Verify multi case support
            var ourBoard2 = new openBCIBoard.OpenBCIBoard({
                sntptimesyncport: expectedPortNumber
            });
            expect(ourBoard2.options.sntpTimeSyncPort).to.equal(expectedPortNumber);
        });
        it('can enter verbose mode', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            (ourBoard.options.verbose).should.equal(true);
        });
        it('should start in current stream state in the init mode', () => {
            ourBoard = new openBCIBoard.OpenBCIBoard();

            ourBoard.curParsingMode.should.equal(k.OBCIParsingReset);
        });
        it('configures impedance testing variables correctly', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard();
            (ourBoard.impedanceTest.active).should.equal(false);
            (ourBoard.impedanceTest.isTestingNInput).should.equal(false);
            (ourBoard.impedanceTest.isTestingPInput).should.equal(false);
            (ourBoard.impedanceTest.onChannel).should.equal(0);
            (ourBoard.impedanceTest.sampleNumber).should.equal(0);
        });
        it('configures impedance array with the correct amount of channels for default', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard();
            (ourBoard.impedanceArray.length).should.equal(8);
        });
        it('configures impedance array with the correct amount of channels for daisy', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                boardType: 'daisy'
            });
            (ourBoard.impedanceArray.length).should.equal(16);
        });
        it('configures impedance array with the correct amount of channels for ganglion', function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                boardType: 'ganglion'
            });
            (ourBoard.impedanceArray.length).should.equal(4);
        });
    });
    describe('#simulator', function() {
        it('can enable simulator after constructor', function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            ourBoard.simulatorEnable().should.be.fulfilled.and.notify(done);
        });
        it('should disable sim and call disconnected', function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            var disconnectSpy = sinon.spy(ourBoard,"disconnect");
            ourBoard.options.simulate.should.equal(false);
            ourBoard.connected = true;
            ourBoard.simulatorEnable().then(() => {
                disconnectSpy.should.have.been.calledOnce;
                ourBoard.options.simulate.should.equal(true);
                done();
            });
        });
        it('should not enable the simulator if already simulating', function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true,
                simulate: true
            });
            ourBoard.simulatorEnable().should.be.rejected.and.notify(done);
        });
        it('can disable simulator', function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true,
                simulate: true
            });
            ourBoard.simulatorDisable().should.be.fulfilled.and.notify(done);
        });
        it('should not disable simulator if not in simulate mode', function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            ourBoard.simulatorDisable().should.be.rejected.and.notify(done);
        });
        it('should start sim and call disconnected', function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true,
                simulate: true
            });
            var disconnectSpy = sinon.spy(ourBoard,"disconnect");
            ourBoard.options.simulate.should.equal(true);
            ourBoard.connected = true;
            ourBoard.simulatorDisable().then(() => {
                disconnectSpy.should.have.been.calledOnce;
                ourBoard.options.simulate.should.equal(false);
                done();
            });
        });
        it('should be able to propagate constructor options to simulator', function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true,
                simulate: true,
                simulatorBoardFailure: true,
                simulatorDaisyModuleAttached: true,
                simulatorFirmwareVersion: k.OBCIFirmwareV2,
                simulatorHasAccelerometer: false,
                simulatorInternalClockDrift: -1,
                simulatorInjectAlpha: false,
                simulatorInjectLineNoise: 'None',
                simulatorSampleRate: 16,
                simulatorSerialPortFailure:true
            });

            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        var simOptions = ourBoard.serial.options;
                        expect(simOptions).to.be.an('object');
                        expect(simOptions.accel).to.be.false;
                        expect(simOptions.alpha).to.be.false;
                        expect(simOptions.boardFailure).to.be.true;
                        expect(simOptions.daisy).to.be.true;
                        expect(simOptions.drift).to.be.below(0);
                        expect(simOptions.firmwareVersion).to.be.equal(k.OBCIFirmwareV2);
                        expect(simOptions.lineNoise).to.be.equal(k.OBCISimulatorLineNoiseNone);
                        expect(simOptions.sampleRate).to.be.equal(16);
                        expect(simOptions.serialPortFailure).to.be.true;
                        expect(simOptions.verbose).to.be.true;
                        ourBoard.disconnect().then(done).catch(done);
                    });
                }).catch(err => done(err));
        });
    });



    describe('#boardTests', function() {
        this.timeout(3000);
        before(function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                simulate: !realBoard,
                verbose: true
            });
            spy = sinon.spy(ourBoard,"_writeAndDrain");
        });
        after(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                });
            } else {
                done()
            }
        });
        afterEach(function() {
            if (spy) spy.reset();
        });
        describe('#connect/disconnect/streamStart/streamStop', function () {
            it('gets the ready signal from the board and sends a stop streaming command before disconnecting', function(done) {
                //spy = sinon.spy(ourBoard,"_writeAndDrain");

                ourBoard.connect(masterPortName).catch(err => done(err));

                ourBoard.once('ready', function() {
                    ourBoard.streamStart().catch(err => done(err)); // start streaming

                    ourBoard.once('sample',(sample) => { // wait till we get a sample
                        ourBoard.disconnect().then(() => { // call disconnect
                            //console.log('Device is streaming: ' + ourBoard.streaming ? 'true' : 'false');
                            setTimeout(() => {
                                spy.should.have.been.calledWithMatch(k.OBCIStreamStop);
                                var conditionalTimeout = realBoard ? 300 : 0;
                                setTimeout(() => {
                                    done();
                                }, conditionalTimeout);
                            }, 4 * k.OBCIWriteIntervalDelayMSShort); // give plenty of time
                        }).catch(err => done(err));
                    });
                });
            });
            it('rawDataPacket is emitted', function(done) {
                ourBoard.connect(masterPortName).catch(err => done(err));
                // for the ready signal test
                ourBoard.once('ready', function() {
                    ourBoard.streamStart().catch(err => done(err)); // start streaming

                    ourBoard.once('rawDataPacket',(rawDataPacket) => { // wait till we get a raw data packet
                        ourBoard.disconnect().then(() => { // call disconnect
                            done();
                        }).catch(err => done(err));
                    });
                });
            });
        });
        describe('#write', function() {
            before(function(done) {
                if (ourBoard.connected) {
                    ourBoard.disconnect().then(() => {
                        done();
                    });
                } else {
                    done()
                }
            });
            it('rejects when not connected', function(done) {
                ourBoard.write('b').should.be.rejected.and.notify(done);
            });
        });
        // good
        describe('#listPorts', function () {
            it('returns a list of ports',function(done) {
                ourBoard.listPorts().then(ports => {
                    if (ports.some(port => {
                            if (port.comName === masterPortName) {
                                return true;
                            }
                        })) {
                        done();
                    } else {
                        done();
                    }
                });
            })
        });
        describe('#sdStart',function() {
            before(function(done) {
                ourBoard.connect(k.OBCISimulatorPortName)
                    .then(() => {
                        ourBoard.once('ready',done);
                    })
                    .catch(err => done(err));
            });
            afterEach(function(done) {
                ourBoard.sdStop()
                    .catch(done);
                ourBoard.once('eot', () => {
                    done();
                });
            });
            after(function(done) {
                ourBoard.disconnect()
                    .then(done)
                    .catch(err => done(err));
            });
            it('can start 14 seconds of logging with sd',function(done) {
                ourBoard.sdStart('14sec')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 5 minutes of logging with sd',function(done) {
                ourBoard.sdStart('5min')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 15 minutes of logging with sd',function(done) {
                ourBoard.sdStart('15min')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 30 minutes of logging with sd',function(done) {
                ourBoard.sdStart('30min')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 1 hour of logging with sd',function(done) {
                ourBoard.sdStart('1hour')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 2 hours of logging with sd',function(done) {
                ourBoard.sdStart('2hour')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 4 hours of logging with sd',function(done) {
                ourBoard.sdStart('4hour')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 12 hours of logging with sd',function(done) {
                ourBoard.sdStart('12hour')
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
            it('can start 24 hours of logging with sd',function(done) {
                ourBoard.sdStart('24hour')
                    .catch(done);
                ourBoard.once('eot', () => {
                    done();
                });
            });
        });
        describe('#sdStop',function() {
            before(function(done) {
                ourBoard.connect(k.OBCISimulatorPortName).catch(err => done(err));
                ourBoard.once('ready',done);
            });
            it('can stop logging with sd',function(done) {
                // console.log('yoyoyo');
                ourBoard.sdStop()
                    .then(() => {
                        // console.log('taco');
                        spy.should.have.been.calledWith('j');
                    })
                    .catch(err => done(err));
                ourBoard.once('eot', () => {
                    done();
                });
            });
        });
        // bad
        describe('#channelOff', function () {
            before(function(done) {
                if (!ourBoard.connected) {
                    ourBoard.connect(masterPortName)
                        .then(done)
                        .catch(err => done(err));
                } else {
                    done();
                }
            });

            it('should call the write function with proper command for channel 1', function(done) {
                ourBoard.channelOff(1).then(() => {
                    setTimeout(() => {
                        spy.should.have.been.calledWith(k.OBCIChannelOff_1);
                        done();
                    }, 5 * k.OBCIWriteIntervalDelayMSShort);
                });
            });
            it('should call the write function with proper command for channel 16', function(done) {
                //spy = sinon.spy(ourBoard,"_writeAndDrain");

                ourBoard.channelOff(16).then(() => {
                    setTimeout(() => {
                        spy.should.have.been.calledWith(k.OBCIChannelOff_16);
                        done();
                    }, 5 * k.OBCIWriteIntervalDelayMSShort);
                });
            });
            it('should reject with invalid channel', function(done) {
                ourBoard.channelOff(0).should.be.rejected.and.notify(done);
            });
            it('should turn the realBoard channel off', function(done) {
                ourBoard.channelOff(1).then(() => {
                    setTimeout(() => {
                        spy.should.have.been.calledWith(k.OBCIChannelOff_1);
                        done();
                    }, 5 * k.OBCIWriteIntervalDelayMSShort);
                });
            });
        });
        // good
        describe('#channelOn', function () {
            before(function(done) {
                if (!ourBoard.connected) {
                    ourBoard.connect(masterPortName)
                        .then(done)
                        .catch(err => done(err));
                } else {
                    done();
                }
            });

            it('should call the write function with proper command for channel 2', function(done) {
                ourBoard.channelOn(2).then(() => {
                    setTimeout(() => {
                        spy.should.have.been.calledWith(k.OBCIChannelOn_2);
                        done();
                    }, 5 * k.OBCIWriteIntervalDelayMSShort);

                });
            });
            it('should call the write function with proper command for channel 16', function(done) {
                ourBoard.channelOn(16).then(() => {
                    setTimeout(() => {
                        spy.should.have.been.calledWith(k.OBCIChannelOn_16);
                        done();
                    }, 5 * k.OBCIWriteIntervalDelayMSShort);

                });
            });
            it('should reject with invalid channel', function(done) {
                ourBoard.channelOn(0).should.be.rejected.and.notify(done);
            });
        });
        // bad
        describe('#channelSet', function () {
            this.timeout(6000);
            before(function(done) {
                if (!ourBoard.connected) {
                    ourBoard.connect(masterPortName)
                        .then(done)
                        .catch(err => done(err));
                } else {
                    done();
                }
            });
            it('should call the writeAndDrain function array of commands 9 times', function(done) {
                setTimeout(() => {
                    spy.reset();
                    ourBoard.channelSet(1,true,24,'normal',true,true,true)
                        .then(() => {
                            setTimeout(() => {
                                spy.callCount.should.equal(9);
                                done()
                            }, 15 * k.OBCIWriteIntervalDelayMSShort);
                        })
                        .catch(err => done(err));
                }, 10 * k.OBCIWriteIntervalDelayMSShort); // give some time for writer to finish
            });

            it('should be rejected', function(done) {
                ourBoard.channelSet(1,true,24,'normal','taco',true,true).should.be.rejected.and.notify(done);
            });
        });

        describe('#impedanceTest Not Connected Rejects ',function() {
            it('rejects all channeles when not streaming', function(done) {
                ourBoard.impedanceTestAllChannels().should.be.rejected.and.notify(done);
            });
            it('rejects array channels when not streaming', function(done) {
                ourBoard.impedanceTestChannels(['-','N','n','p','P','-','b','b']).should.be.rejected.and.notify(done);
            });
        });
        describe('#impedancePrivates', function () {
            describe('disconnected', function() {
                before(function(done) {
                    if (ourBoard.connected) {
                        ourBoard.disconnect()
                            .then(done)
                            .catch(err => done(err));
                    } else {
                        done();
                    }
                });
                describe('#_impedanceTestSetChannel', function () {
                    it('should reject because not connected', function(done) {
                        ourBoard._impedanceTestSetChannel(0,false,false).should.be.rejected.and.notify(done);
                    });
                });
            });
        });

    });

    /**
     * Test the function that parses an incoming data buffer for packets
     */
    describe('#_processDataBuffer', function() {
        var _processQualifiedPacketSpy;
        before(() => {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            _processQualifiedPacketSpy = sinon.spy(ourBoard,"_processQualifiedPacket");
        });
        after(() => {
            ourBoard = null;
        });

        it('should do nothing when empty buffer inserted', () => {
            var buffer = null;

            // Test the function
            buffer = ourBoard._processDataBuffer(buffer);

            expect(buffer).to.be.null;
        });
        it('should return an unaltered buffer if there is less than a packets worth of data in it', () => {
            var expectedString = "AJ";
            var buffer = new Buffer(expectedString);

            // Reset the spy if it exists
            if(_processQualifiedPacketSpy) _processQualifiedPacketSpy.reset();

            // Test the function
            buffer = ourBoard._processDataBuffer(buffer);

            // Convert the buffer to a string and ensure that it equals the expected string
            buffer.toString().should.equal(expectedString);

            // Make sure that the spy was not infact called.
            _processQualifiedPacketSpy.should.not.have.been.called;
        });
        it('should identify a packet',() => {
            var buffer = openBCISample.samplePacketReal(0);

            // Reset the spy if it exists
            if(_processQualifiedPacketSpy) _processQualifiedPacketSpy.reset();

            // Call the function under test
            buffer = ourBoard._processDataBuffer(buffer);

            // Ensure that we extracted only one buffer
            _processQualifiedPacketSpy.should.have.been.calledOnce;

            // The buffer should not have anything in it any more
            expect(buffer).to.be.null;
        });
        it('should extract a buffer and preserve the remaining data in the buffer',() => {
            var expectedString = "AJ";
            var extraBuffer = new Buffer(expectedString);
            // declare the big buffer
            var buffer = new Buffer(k.OBCIPacketSize + extraBuffer.length);
            // Fill that new big buffer with buffers
            openBCISample.samplePacketReal(0).copy(buffer,0);
            extraBuffer.copy(buffer,k.OBCIPacketSize);
            // Reset the spy if it exists
            if(_processQualifiedPacketSpy) _processQualifiedPacketSpy.reset();
            // Call the function under test
            buffer = ourBoard._processDataBuffer(buffer);
            // Ensure that we extracted only one buffer
            _processQualifiedPacketSpy.should.have.been.called;
            // The buffer should have the epxected number of bytes left
            buffer.length.should.equal(expectedString.length);
            // Convert the buffer to a string and ensure that it equals the expected string
            buffer.toString().should.equal(expectedString);
        });

        it('should be able to extract multiple packets from a single buffer',() => {
            // We are going to extract multiple buffers
            var expectedNumberOfBuffers = 3;
            // declare the big buffer
            var buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers);
            // Fill that new big buffer with buffers
            openBCISample.samplePacketReal(0).copy(buffer,0);
            openBCISample.samplePacketReal(1).copy(buffer,k.OBCIPacketSize);
            openBCISample.samplePacketReal(2).copy(buffer,k.OBCIPacketSize * 2);
            // Reset the spy if it exists
            if(_processQualifiedPacketSpy) _processQualifiedPacketSpy.reset();
            // Call the function under test
            buffer = ourBoard._processDataBuffer(buffer);
            // Ensure that we extracted only one buffer
            _processQualifiedPacketSpy.should.have.been.calledThrice;
            // The buffer should not have anything in it any more
            expect(buffer).to.be.null;
        });

        it('should be able to get multiple packets and keep extra data on the end', () => {
            var expectedString = "AJ";
            var extraBuffer = new Buffer(expectedString);
            // We are going to extract multiple buffers
            var expectedNumberOfBuffers = 2;
            // declare the big buffer
            var buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers + extraBuffer.length);
            // Fill that new big buffer with buffers
            openBCISample.samplePacketReal(0).copy(buffer,0);
            openBCISample.samplePacketReal(1).copy(buffer,k.OBCIPacketSize);
            extraBuffer.copy(buffer,k.OBCIPacketSize * 2);
            // Reset the spy if it exists
            if(_processQualifiedPacketSpy) _processQualifiedPacketSpy.reset();
            // Call the function under test
            buffer = ourBoard._processDataBuffer(buffer);
            // Ensure that we extracted only one buffer
            _processQualifiedPacketSpy.should.have.been.calledTwice;
            // The buffer should not have anything in it any more
            buffer.length.should.equal(extraBuffer.length);
        });

        it('should be able to get multiple packets with junk in the middle', () => {
            var expectedString = ",";
            var extraBuffer = new Buffer(expectedString);
            // We are going to extract multiple buffers
            var expectedNumberOfBuffers = 2;
            // declare the big buffer
            var buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers + extraBuffer.length);
            // Fill that new big buffer with buffers
            openBCISample.samplePacketReal(0).copy(buffer,0);
            extraBuffer.copy(buffer,k.OBCIPacketSize);
            openBCISample.samplePacketReal(1).copy(buffer,k.OBCIPacketSize + extraBuffer.byteLength);

            // Reset the spy if it exists
            if(_processQualifiedPacketSpy) _processQualifiedPacketSpy.reset();
            // Call the function under test
            buffer = ourBoard._processDataBuffer(buffer);
            // Ensure that we extracted only one buffer
            _processQualifiedPacketSpy.should.have.been.calledTwice;
            // The buffer should not have anything in it any more
            bufferEqual(extraBuffer,buffer).should.be.true;
            buffer.length.should.equal(extraBuffer.length);
        });

        it('should be able to get multiple packets with junk in the middle and end', () => {
            var expectedString = ",";
            var extraBuffer = new Buffer(expectedString);
            // We are going to extract multiple buffers
            var expectedNumberOfBuffers = 2;
            // declare the big buffer
            var buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers + extraBuffer.length * 2);
            // Fill that new big buffer with buffers
            openBCISample.samplePacketReal(0).copy(buffer,0);
            extraBuffer.copy(buffer,k.OBCIPacketSize);
            openBCISample.samplePacketReal(1).copy(buffer,k.OBCIPacketSize + extraBuffer.byteLength);
            extraBuffer.copy(buffer,k.OBCIPacketSize * 2 + extraBuffer.byteLength);
            // Reset the spy if it exists
            if(_processQualifiedPacketSpy) _processQualifiedPacketSpy.reset();
            // Call the function under test
            buffer = ourBoard._processDataBuffer(buffer);
            // Ensure that we extracted only one buffer
            _processQualifiedPacketSpy.should.have.been.calledTwice;
            // The buffer should not have anything in it any more
            bufferEqual(Buffer.concat([extraBuffer,extraBuffer],2),buffer).should.be.true;
            buffer.length.should.equal(extraBuffer.length * 2);
        });
    });

    /**
     * Test the function that routes raw packets for processing
     */
    describe('#_processQualifiedPacket', function() {
        var ourBoard;
        var funcSpyTimeSyncSet, funcSpyTimeSyncedAccel, funcSpyTimeSyncedRawAux, funcSpyStandardRawAux, funcSpyStandardAccel;

        before(function() {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            // Put watchers on all functions
            funcSpyStandardAccel = sinon.spy(ourBoard,"_processPacketStandardAccel");
            funcSpyStandardRawAux = sinon.spy(ourBoard,"_processPacketStandardRawAux");
            funcSpyTimeSyncSet = sinon.spy(ourBoard,"_processPacketTimeSyncSet");
            funcSpyTimeSyncedAccel = sinon.spy(ourBoard,"_processPacketTimeSyncedAccel");
            funcSpyTimeSyncedRawAux = sinon.spy(ourBoard,"_processPacketTimeSyncedRawAux");
        });
        beforeEach(function() {
            funcSpyStandardAccel.reset();
            funcSpyStandardRawAux.reset();
            funcSpyTimeSyncSet.reset();
            funcSpyTimeSyncedAccel.reset();
            funcSpyTimeSyncedRawAux.reset();

            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
        });
        after(function() {
            // ourBoard = null;
        });


        it('should process a standard packet',function() {
            var buffer = openBCISample.samplePacket(0);

            // Call the function under test
            ourBoard._processQualifiedPacket(buffer);

            // Ensure that we extracted only one buffer
            funcSpyStandardAccel.should.have.been.calledOnce;
        });
        it('should process a standard packet with raw aux',function() {
            var buffer = openBCISample.samplePacketStandardRawAux(0);

            // Call the function under test
            ourBoard._processQualifiedPacket(buffer);

            // Ensure that we extracted only one buffer
            funcSpyStandardRawAux.should.have.been.calledOnce;
        });
        it('should call nothing for a user defined packet type ',function() {
            var buffer = openBCISample.samplePacketUserDefined();

            // Call the function under test
            ourBoard._processQualifiedPacket(buffer);

            // Nothing should be called
            funcSpyStandardAccel.should.not.have.been.called;
            funcSpyStandardRawAux.should.not.have.been.called;
            funcSpyTimeSyncSet.should.not.have.been.called;
            funcSpyTimeSyncedAccel.should.not.have.been.called;
            funcSpyTimeSyncedRawAux.should.not.have.been.called;
        });
        it('should process a time sync set packet with accel',function() {
            var buffer = openBCISample.samplePacketAccelTimeSyncSet();

            // Call the function under test
            ourBoard._processQualifiedPacket(buffer);

            // We should call to sync up
            funcSpyTimeSyncSet.should.have.been.calledOnce;
            funcSpyTimeSyncSet.should.have.been.calledWith(buffer);
            // we should call to get a packet
            funcSpyTimeSyncedAccel.should.have.been.calledOnce;
            funcSpyTimeSyncedAccel.should.have.been.calledWith(buffer);
        });
        it('should process a time synced packet with accel',function() {
            var buffer = openBCISample.samplePacketAccelTimeSynced(0);

            // Call the function under test
            ourBoard._processQualifiedPacket(buffer);

            // Ensure that we extracted only one buffer
            funcSpyTimeSyncedAccel.should.have.been.calledOnce;
        });
        it('should process a time sync set packet with raw aux',function() {
            var buffer = openBCISample.samplePacketRawAuxTimeSyncSet(0);

            // Call the function under test
            ourBoard._processQualifiedPacket(buffer);

            // We should call to sync up
            funcSpyTimeSyncSet.should.have.been.calledOnce;
            funcSpyTimeSyncSet.should.have.been.calledWith(buffer);
            // we should call to get a packet
            funcSpyTimeSyncedRawAux.should.have.been.calledOnce;
            funcSpyTimeSyncedRawAux.should.have.been.calledWith(buffer);
        });
        it('should process a time synced packet with raw aux',function() {
            var buffer = openBCISample.samplePacketRawAuxTimeSynced(0);

            // Call the function under test
            ourBoard._processQualifiedPacket(buffer);

            // Ensure that we extracted only one buffer
            funcSpyTimeSyncedRawAux.should.have.been.calledOnce;
        });
        it('should not identify any packet',function() {
            var buffer = openBCISample.samplePacket(0);

            // Set the stop byte to some number not yet defined
            buffer[k.OBCIPacketPositionStopByte] = 0xCF;

            // Call the function under test
            ourBoard._processDataBuffer(buffer);

            // Nothing should be called
            funcSpyStandardAccel.should.not.have.been.called;
            funcSpyStandardRawAux.should.not.have.been.called;
            funcSpyTimeSyncSet.should.not.have.been.called;
            funcSpyTimeSyncedAccel.should.not.have.been.called;
            funcSpyTimeSyncedRawAux.should.not.have.been.called;
        });
    });

    describe("#_processPacketTimeSyncSet", function() {
        var timeSyncSetPacket;
        var ourBoard;
        before(() => {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: false
            });

        });
        beforeEach(() => {
            timeSyncSetPacket = openBCISample.samplePacketRawAuxTimeSyncSet();
            ourBoard.sync.timeOffsetArray = [];
        });
        afterEach(() => {
            ourBoard.sync.curSyncObj = null;
        });
        it("should reject if no sync in progress", function(done) {
            var timeSetPacketArrived = ourBoard.time();
            ourBoard.curParsingMode = k.OBCIParsingTimeSyncSent;
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived).should.be.rejected.and.notify(done);
        });
        it("should reject if no sent confimation found", function(done) {
            var timeSetPacketArrived = ourBoard.time();
            ourBoard.curParsingMode = k.OBCIParsingTimeSyncSent;
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived).should.be.rejected.and.notify(done);
        });
        it("should reset global sync variables if no sent confimation found", function(done) {
            var timeSetPacketArrived = ourBoard.time();
            ourBoard.curParsingMode = k.OBCIParsingTimeSyncSent;
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived)
                .then(() => {
                    done("failed to get rejected");
                })
                .catch(function(err) {
                    expect(ourBoard.curParsingMode).to.equal(k.OBCIParsingNormal);
                    expect(ourBoard.sync.curSyncObj).to.be.null;
                    done();
                });
        });
        it("should emit sycned event with valid false", function(done) {
            var timeSetPacketArrived = ourBoard.time();
            ourBoard.curParsingMode = k.OBCIParsingTimeSyncSent;
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            ourBoard.once('synced',obj => {
                expect(obj.valid).to.be.false;
                done();
            })
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived);
        });
        it("should calculate round trip time as the difference between time sent and time set packet arrived",function(done) {
            var timeSetPacketArrived = ourBoard.time();
            var expectedRoundTripTime = 20; //ms
            ourBoard.curParsingMode = k.OBCIParsingNormal; // indicates the sent conf was found
            // Make a new object!
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            // Set the sent time
            ourBoard.sync.curSyncObj.timeSyncSent = timeSetPacketArrived - expectedRoundTripTime;

            ourBoard.once('synced',obj => {
                expect(obj.timeRoundTrip).to.equal(expectedRoundTripTime);
                done();
            })
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived);
        });
        it("should calculate transmission time as the difference between round trip time and (sentConf - sent) when set arrived - sent conf is larger than threshold",function(done) {
            var timeSetPacketArrived = ourBoard.time();
            var expectedRoundTripTime = 20; //ms
            var expectedTimeTillSentConf = expectedRoundTripTime - k.OBCITimeSyncThresholdTransFailureMS - 1; // 9 ms
            // Setup
            ourBoard.curParsingMode = k.OBCIParsingNormal; // indicates the sent conf was found
            // Make a new object!
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            // Set the sent time
            ourBoard.sync.curSyncObj.timeSyncSent = timeSetPacketArrived - expectedRoundTripTime;
            ourBoard.sync.curSyncObj.timeSyncSentConfirmation = ourBoard.sync.curSyncObj.timeSyncSent + expectedTimeTillSentConf;

            ourBoard.once('synced',obj => {
                expect(obj.timeTransmission).to.equal(obj.timeRoundTrip - (obj.timeSyncSentConfirmation - obj.timeSyncSent));
                done();
            })
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived);
        });
        it("should calculate transmission time as a percentage of round trip time when set arrived - sent conf is smaller than threshold",function(done) {
            var timeSetPacketArrived = ourBoard.time();
            var expectedRoundTripTime = 20; //ms
            var expectedTimeTillSentConf = expectedRoundTripTime - k.OBCITimeSyncThresholdTransFailureMS + 1; // 11 ms
            // Setup
            ourBoard.curParsingMode = k.OBCIParsingNormal; // indicates the sent conf was found
            // Make a new object!
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            // Set the sent time
            ourBoard.sync.curSyncObj.timeSyncSent = timeSetPacketArrived - expectedRoundTripTime;
            ourBoard.sync.curSyncObj.timeSyncSentConfirmation = ourBoard.sync.curSyncObj.timeSyncSent + expectedTimeTillSentConf;

            ourBoard.once('synced',obj => {
                expect(obj.timeTransmission).to.equal(obj.timeRoundTrip * k.OBCITimeSyncMultiplierWithSyncConf);
                done();
            })
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived);
        });
        it("should calculate offset time as a time packet arrived - transmission time - board time",function(done) {
            var timeSetPacketArrived = ourBoard.time();
            var expectedRoundTripTime = 20; //ms
            var expectedTimeTillSentConf = expectedRoundTripTime - k.OBCITimeSyncThresholdTransFailureMS - 2; // 8 ms
            // Set the board time
            var boardTime = 5000;
            timeSyncSetPacket.writeInt32BE(boardTime,k.OBCIPacketPositionTimeSyncTimeStart);

            // Setup
            ourBoard.curParsingMode = k.OBCIParsingNormal; // indicates the sent conf was found
            // Make a new object!
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            // Set the sent time
            ourBoard.sync.curSyncObj.timeSyncSent = timeSetPacketArrived - expectedRoundTripTime;
            ourBoard.sync.curSyncObj.timeSyncSentConfirmation = ourBoard.sync.curSyncObj.timeSyncSent + expectedTimeTillSentConf;

            var expectedTransmissionTime = expectedRoundTripTime - (ourBoard.sync.curSyncObj.timeSyncSentConfirmation - ourBoard.sync.curSyncObj.timeSyncSent);

            var expectedTimeOffset = timeSetPacketArrived - expectedTransmissionTime - boardTime;

            ourBoard.once('synced',obj => {
                expect(obj.timeOffset,"object timeOffset").to.equal(expectedTimeOffset);
                expect(ourBoard.sync.timeOffsetMaster,"master time offset").to.equal(expectedTimeOffset);
                done();
            })
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived);
        });
        it("should calculate offset time as an average of previous offset times",function(done) {
            var timeSetPacketArrived = ourBoard.time();
            var expectedRoundTripTime = 20; //ms
            var expectedTimeTillSentConf = expectedRoundTripTime - k.OBCITimeSyncThresholdTransFailureMS - 2; // 8 ms
            // Set the board time
            var boardTime = 5000;
            timeSyncSetPacket.writeInt32BE(boardTime,k.OBCIPacketPositionTimeSyncTimeStart);

            // Setup
            ourBoard.curParsingMode = k.OBCIParsingNormal; // indicates the sent conf was found
            // Make a new object!
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
            // Set the sent time
            ourBoard.sync.curSyncObj.timeSyncSent = timeSetPacketArrived - expectedRoundTripTime;
            ourBoard.sync.curSyncObj.timeSyncSentConfirmation = ourBoard.sync.curSyncObj.timeSyncSent + expectedTimeTillSentConf;

            var expectedTransmissionTime = expectedRoundTripTime - (ourBoard.sync.curSyncObj.timeSyncSentConfirmation - ourBoard.sync.curSyncObj.timeSyncSent);

            var expectedTimeOffset = timeSetPacketArrived - expectedTransmissionTime - boardTime;

            var dif1 = 3;
            ourBoard.sync.timeOffsetArray.push(expectedTimeOffset + dif1);
            var dif2 = 1;
            ourBoard.sync.timeOffsetArray.push(expectedTimeOffset + dif2);

            ourBoard.once('synced',obj => {
                expect(obj.timeOffset,"object timeOffset").to.equal(expectedTimeOffset);

                var expectedMasterTimeoffset = math.floor((obj.timeOffset + (obj.timeOffset + dif1) + (obj.timeOffset + dif2)) / 3);
                expect(ourBoard.sync.timeOffsetMaster,"master time offset").to.equal(expectedMasterTimeoffset);
                done();
            })
            ourBoard._processPacketTimeSyncSet(timeSyncSetPacket,timeSetPacketArrived);
        });
    });

    describe("#time", function() {
        it("should use sntp time when sntpTimeSync specified in options", function() {
            var board = new openBCIBoard.OpenBCIBoard({
                verbose: true,
                sntpTimeSync: true
            });
            var funcSpySntpNow = sinon.spy(board,"_sntpNow");

            board.time();

            funcSpySntpNow.should.have.been.calledOnce;

            funcSpySntpNow.reset();

            funcSpySntpNow = null;
        });
        it("should use Date.now() for time when sntpTimeSync is not specified in options", function() {
            var board = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            var funcSpySntpNow = sinon.spy(board,"_sntpNow");

            board.time();

            funcSpySntpNow.should.not.have.been.called;

            funcSpySntpNow.reset();

            funcSpySntpNow = null;
        });
        it("should emit sntpTimeLock event after sycned with ntp server", function(done) {
            var board = new openBCIBoard.OpenBCIBoard({
                verbose: true,
                sntpTimeSync: true
            });

            board.once('sntpTimeLock', () => {
                done();
            })
        });
    });
    describe("#sntpStart",function() {
        var board;
        before(() => {
            board = new openBCIBoard.OpenBCIBoard();
            board.sntpStop();
        });
        after(() => {
            board.sntpStop();
        })
        it("should be able to start ntp server", done => {
            expect(board.sntp.isLive()).to.be.false;
            board.sntpStart()
                .then(() => {
                    expect(board.sntp.isLive()).to.be.true;
                })
            board.once("sntpTimeLock", () => {
                done();
            });
        });
    });
    describe("#sntpStop",function() {
        var board;
        before(done => {
            board = new openBCIBoard.OpenBCIBoard({
                sntpTimeSync: true
            });
            board.once("sntpTimeLock", () => {
                done();
            });
        });
        after(() => {
            board.sntpStop();
        })
        it("should be able to stop the ntp server and set the globals correctly",function() {
            // Verify the before condition is correct
            expect(board.options.sntpTimeSync).to.be.true;
            expect(board.sync.sntpActive).to.be.true;
            expect(board.sntp.isLive()).to.be.true;

            // Call the function under test
            board.sntpStop();

            // Ensure the globals were set off
            expect(board.options.sntpTimeSync).to.be.false;
            expect(board.sync.sntpActive).to.be.false;
            expect(board.sntp.isLive()).to.be.false;

        });
    });
    describe("#_processParseBufferForReset",function() {
        var ourBoard;


        before(() => {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
        });
        beforeEach(() => {
            ourBoard.info = {
                boardType:"burrito",
                sampleRate:60,
                firmware:'taco',
                numberOfChannels:200
            };
        });

        after(() => {
            ourBoard = null;
        });


        it("should recognize firmware version 1 with no daisy", () => {
            var buf = new Buffer(`OpenBCI V3 Simulator\nOn Board ADS1299 Device ID: 0x12345\nLIS3DH Device ID: 0x38422$$$`);

            ourBoard._processParseBufferForReset(buf);

            ourBoard.info.firmware.should.equal(k.OBCIFirmwareV1);
            ourBoard.info.boardType.should.equal(k.OBCIBoardDefault);
            ourBoard.info.sampleRate.should.equal(k.OBCISampleRate250);
            ourBoard.info.numberOfChannels.should.equal(k.OBCINumberOfChannelsDefault);
        });
        it("should recognize firmware version 1 with daisy", () => {
            var buf = new Buffer(`OpenBCI V3 Simulator\nOn Board ADS1299 Device ID: 0x12345\nOn Daisy ADS1299 Device ID: 0xFFFFF\nLIS3DH Device ID: 0x38422\n$$$`);

            ourBoard._processParseBufferForReset(buf);

            ourBoard.info.firmware.should.equal(k.OBCIFirmwareV1);
            ourBoard.info.boardType.should.equal(k.OBCIBoardDaisy);
            ourBoard.info.sampleRate.should.equal(k.OBCISampleRate125);
            ourBoard.info.numberOfChannels.should.equal(k.OBCINumberOfChannelsDaisy);

        });
        it("should recognize firmware version 2 with no daisy", () => {
            var buf = new Buffer(`OpenBCI V3 Simulator\nOn Board ADS1299 Device ID: 0x12345\nLIS3DH Device ID: 0x38422\nFirmware: v2\n$$$`);

            ourBoard._processParseBufferForReset(buf);

            ourBoard.info.firmware.should.equal(k.OBCIFirmwareV2);
            ourBoard.info.boardType.should.equal(k.OBCIBoardDefault);
            ourBoard.info.sampleRate.should.equal(k.OBCISampleRate250);
            ourBoard.info.numberOfChannels.should.equal(k.OBCINumberOfChannelsDefault);

        });
        it("should recognize firmware version 2 with daisy", () => {
            var buf = new Buffer(`OpenBCI V3 Simulator\nOn Board ADS1299 Device ID: 0x12345\nOn Daisy ADS1299 Device ID: 0xFFFFF\nLIS3DH Device ID: 0x38422\nFirmware: v2\n$$$`);

            ourBoard._processParseBufferForReset(buf);

            ourBoard.info.firmware.should.equal(k.OBCIFirmwareV2);
            ourBoard.info.boardType.should.equal(k.OBCIBoardDaisy);
            ourBoard.info.sampleRate.should.equal(k.OBCISampleRate125);
            ourBoard.info.numberOfChannels.should.equal(k.OBCINumberOfChannelsDaisy);

        });
    });

    describe("#_processBytes",function() {
        before(() => {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
        });
        beforeEach(() => {
            ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
        })
        afterEach(() => {
            ourBoard.buffer = null;
        });

        describe("#OBCIParsingReset",function() {
            var _processParseBufferForResetSpy;
            before(() => {
                _processParseBufferForResetSpy = sinon.spy(ourBoard,"_processParseBufferForReset");
            });
            beforeEach(() => {
                _processParseBufferForResetSpy.reset();
            });
            it("should wait till EOT ($$$) before starting parse",function() {
                var buf1 = new Buffer(`OpenBCI V3 Simulator\nOn Board ADS1299 Device ID: 0x12345\n`);
                var buf2 = new Buffer(`On Daisy ADS1299 Device ID: 0xFFFFF\nLIS3DH Device ID: `);
                var buf3 = new Buffer(`0x38422\n$$$`);

                // Fake a soft reset send
                ourBoard.curParsingMode = k.OBCIParsingReset;

                // Send the first buffer
                ourBoard._processBytes(buf1);
                // Verify the parse function was not called
                _processParseBufferForResetSpy.should.not.have.been.called;
                // Verify the global buffer has the first buf in it
                bufferEqual(ourBoard.buffer,buf1);
                // Send another buffer without EOT
                ourBoard._processBytes(buf2);
                // Verify the parse function was not called
                _processParseBufferForResetSpy.should.not.have.been.called;
                // Verify the global buffer has the first and second buf in it
                bufferEqual(ourBoard.buffer,Buffer.concat([buf1,buf2]));
                // Send another buffer without EOT
                ourBoard._processBytes(buf3);
                // Verify the parse function was called
                _processParseBufferForResetSpy.should.have.been.calledOnce;
                // Verify the global buffer is empty
                expect(ourBoard.buffer).to.be.null;

            });
        });


        describe("#OBCIParsingTimeSyncSent",function() {
            // var spy;
            before(() => {
                // spy = sinon.spy(ourBoard.openBCISample,"isTimeSyncSetConfirmationInBuffer");
            });
            beforeEach(() => {
                ourBoard.curParsingMode = k.OBCIParsingTimeSyncSent;
                ourBoard.sync.curSyncObj = openBCISample.newSyncObject();
                // spy.reset();
            });
            it("should call to find the time sync set character in the buffer", function(done) {
                // Verify the log event is called
                var buf = new Buffer(",");
                // Call the processBytes function
                ourBoard._processBytes(buf);
                // Verify the function was called
                expect(ourBoard.curParsingMode).to.equal(k.OBCIParsingNormal);

                // Listen for the sample event
                ourBoard.once('sample',() => {
                    // Verify the buffer is cleared
                    expect(ourBoard.buffer).to.be.null;
                    done();
                });
                // Make a new buffer
                var buf1 = openBCISample.samplePacketReal(1);
                // Send the buffer in
                ourBoard._processBytes(buf1);
            });
            it("should clear the buffer after a time sync set packet", function(done) {
                // Verify the log event is called
                var buf = new Buffer(",");
                // Call the processBytes function
                ourBoard._processBytes(buf);
                // Verify the function was called
                expect(ourBoard.curParsingMode).to.equal(k.OBCIParsingNormal);

                // Listen for the sample event
                ourBoard.once('synced',() => {
                    // Verify the buffer is cleared
                    expect(ourBoard.buffer).to.be.null;
                    done();
                });
                // Make a new buffer
                var buf1 = openBCISample.samplePacketAccelTimeSyncSet(1);
                // Send the buffer in
                ourBoard._processBytes(buf1);
            });
            it("should call to find the time sync set character in the buffer after packet", function() {
                var buf1 = openBCISample.samplePacket();
                var buf2 = new Buffer(",");

                // Call the processBytes function
                ourBoard._processBytes(Buffer.concat([buf1,buf2],buf1.length + 1));
                // Verify the function was called
                expect(ourBoard.curParsingMode).to.equal(k.OBCIParsingNormal);
                // Verify the buffer is empty
                // expect(ourBoard.buffer).to.be.null;
                // ourBoard.buffer.length.should.equal(0);
            });
            it("should find time sync and emit two samples", function(done) {

                var buf1 = openBCISample.samplePacket(250);
                var buf2 = new Buffer([0x2C]);
                var buf3 = openBCISample.samplePacket(251);

                var inputBuf = Buffer.concat([buf1,buf2,buf3],buf1.byteLength + 1 + buf3.byteLength);

                var sampleCounter = 0;

                var newSample = sample => {
                    // console.log(`sample ${JSON.stringify(sample)}`);
                    if (sampleCounter == 0) {
                        sample.sampleNumber.should.equal(250);
                    } else if (sampleCounter == 1) {
                        sample.sampleNumber.should.equal(251);
                        // bufferEqual(buf1, buffer).should.be.true;
                        // ourBoard.buffer.length.should.equal(buf1.length);
                        ourBoard.removeListener("sample", newSample);
                        expect(ourBoard.curParsingMode).to.equal(k.OBCIParsingNormal);
                        done();
                    }
                    sampleCounter++;
                };

                ourBoard.on("sample",newSample);

                // Call the processBytes function
                ourBoard._processBytes(inputBuf);

            });
            it("should not find the packet if in packet", () => {

                var buf1 = openBCISample.samplePacket(250);
                buf1[4] = 0x2C; // Inject a false packet
                var buf2 = openBCISample.samplePacket(251);

                // Call the processBytes function
                ourBoard._processBytes(Buffer.concat([buf1,buf2],buf1.length + buf2.length));
                // Verify the time sync set was NOT called
                expect(ourBoard.curParsingMode).to.equal(k.OBCIParsingTimeSyncSent);

            });
        });

        describe("#OBCIParsingNormal",function() {
            before(() => {
                ourBoard.curParsingMode = k.OBCIParsingNormal;
            });
            it("should emit a sample when inserted",function(done) {
                var expectedSampleNumber = 0;
                var buf1 = openBCISample.samplePacketReal(expectedSampleNumber);

                // Declare the event emitter prior to calling function
                ourBoard.once("sample",sample => {
                    sample.sampleNumber.should.equal(expectedSampleNumber);

                    expect(ourBoard.buffer).to.be.null;
                    done();
                });

                // Now call the function which should call the "sample" event
                ourBoard._processBytes(buf1);
            });
            it("should get three packets even if one was sent in the last data emit", function(done) {
                var expectedSampleNumber = 0;
                var buf1 = openBCISample.samplePacketReal(expectedSampleNumber);
                var buf2 = openBCISample.samplePacketReal(expectedSampleNumber+1);
                var buf3 = openBCISample.samplePacketReal(expectedSampleNumber+2);
                // Pretend that half of buf1 got sent in the first serial flush
                //  and that the last half of it will arrive a lil later
                var splitPoint = 15;
                if (process.version > 6) {
                    // from introduced in node version 6.x.x
                    ourBoard.buffer = Buffer.from(buf1.slice(0,splitPoint));
                } else {
                    ourBoard.buffer = new Buffer(buf1.slice(0,splitPoint));
                }
                var dataBuf = Buffer.concat([buf1.slice(splitPoint),buf2,buf3]);

                var sampleCounter = 0;
                var newSample = sample => {
                    if (sampleCounter == expectedSampleNumber) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber);
                    } else if (sampleCounter == expectedSampleNumber + 1) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber + 1);
                    } else if (sampleCounter == expectedSampleNumber + 2) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber + 2);
                        expect(ourBoard.buffer).to.be.null;
                        ourBoard.removeListener("sample", newSample);
                        done();
                    } else {
                        done(`invalid sample number: expected ${sampleCounter} got ${sample.sampleNumber}`);
                    }
                    sampleCounter++;
                };
                ourBoard.on("sample",newSample);
                // Now call the function which should call the "sample" event
                ourBoard._processBytes(dataBuf);
            });
            it("should keep extra data in the buffer", function(done) {
                var expectedSampleNumber = 0;
                var buf1 = openBCISample.samplePacketReal(expectedSampleNumber);
                var buf2 = openBCISample.samplePacketReal(expectedSampleNumber+1);
                var buf3 = openBCISample.samplePacketReal(expectedSampleNumber+2);
                // Pretend that half of buf1 got sent in the first serial flush
                //  and that the last half of it will arrive a lil later
                var splitPoint = 15;

                ourBoard["buffer"] = null;
                var bufFirstHalf, bufLastHalf;
                if (process.version > 6) {
                    // from introduced in node version 6.x.x
                    bufFirstHalf = Buffer.from(buf3.slice(0,splitPoint));
                    bufLastHalf = Buffer.from(buf3.slice(splitPoint));
                } else {
                    bufFirstHalf = new Buffer(buf3.slice(0,splitPoint));
                    bufLastHalf = new Buffer(buf3.slice(splitPoint));
                }

                var sampleCounter = 0;
                var newSample = sample => {
                    if (sampleCounter == expectedSampleNumber) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber);
                    } else if (sampleCounter == expectedSampleNumber + 1) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber + 1);
                    } else if (sampleCounter == expectedSampleNumber + 2) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber + 2);
                        expect(ourBoard.buffer).to.be.null;
                        ourBoard.removeListener("sample", newSample);
                        done();
                    } else {
                        done(`invalid sample number: expected ${sampleCounter} got ${sample.sampleNumber}`);
                    }
                    sampleCounter++;
                };
                ourBoard.on("sample",newSample);
                // Now call the function which should call the "sample" event
                ourBoard._processBytes(Buffer.concat([buf1,buf2,bufFirstHalf]));
                // Now verify there is data still in the global buffer by calling _processBytes on the last half
                ourBoard._processBytes(bufLastHalf);
            });
            it("should throw out old data if it is incomplete and add to badPackets count",function(done) {
                // Some how this packet go messed up and lodged in... This is the worst case, that the buffer has
                //  an incomplete packet.
                ourBoard.buffer = new Buffer([0xA0,0,0,0,0,0,0,0,0,0,0,0xC0]);

                // New buffer incoming
                var expectedSampleNumber = 1;
                var buf1 = openBCISample.samplePacketReal(expectedSampleNumber);
                var buf2 = openBCISample.samplePacketReal(expectedSampleNumber+1);
                var buf3 = openBCISample.samplePacketReal(expectedSampleNumber+2);

                // New data incoming!
                var dataBuf = Buffer.concat([buf1,buf2,buf3]);

                var sampleCounter = expectedSampleNumber;
                var newSample = sample => {
                    if (sampleCounter == expectedSampleNumber) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber);
                    } else if (sampleCounter == expectedSampleNumber + 1) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber + 1);
                    } else if (sampleCounter == expectedSampleNumber + 2) {
                        expect(sample.sampleNumber).to.equal(expectedSampleNumber + 2);
                        // Verify that the old data was rejected
                        expect(ourBoard.buffer).to.be.null;
                        ourBoard.removeListener("sample", newSample);
                        done();
                    } else {
                        done(`invalid sample number: expected ${sampleCounter} got ${sample.sampleNumber}`);
                    }
                    sampleCounter++;
                };
                ourBoard.on("sample",newSample);
                // Now call the function which should call the "sample" event
                ourBoard._processBytes(dataBuf);
            });
        });

        describe("#OBCIParsingEOT",function() {
            beforeEach(() => {
                ourBoard.curParsingMode = k.OBCIParsingEOT;
            });
            it("should emit the 'eot' event",function(done) {
                var buf = new Buffer("Tacos are amazing af$$$");

                var eotEvent = data => {
                    expect(bufferEqual(data,buf)).to.be.true;
                    ourBoard.curParsingMode.should.be.equal(k.OBCIParsingNormal);
                    done();
                };

                ourBoard.once('eot',eotEvent);

                ourBoard._processBytes(buf);
            });
            it("should emit the 'eot' event even if stuff comes in two serial flushes",function(done) {
                var buf1 = new Buffer("Tacos are ");
                var buf2 = new Buffer("amazing af$$$");

                var eotEvent = data => {
                    bufferEqual(data,Buffer.concat([buf1,buf2],buf1.length + buf2.length)).should.be.true;
                    ourBoard.curParsingMode.should.be.equal(k.OBCIParsingNormal);
                    done();
                };

                ourBoard.once('eot',eotEvent);

                ourBoard._processBytes(buf1);
                ourBoard._processBytes(buf2);
            });
        });
    });

    describe("#_finalizeNewSampleForDaisy", function() {
        var ourBoard, randomSampleGenerator, sampleEvent, failTimeout;
        before(() => {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            randomSampleGenerator = openBCISample.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250, false, 'None');
        });
        beforeEach(() => {
            // Clear the global var
            ourBoard._lowerChannelsSampleObject = null;
            ourBoard.info.missedPackets = 0;
        });
        afterEach(() => {
            if (sampleEvent) {
                ourBoard.removeListener("sample",sampleEvent);
                sampleEvent = null;
            }
            if (failTimeout) {
                clearTimeout(failTimeout);
                failTimeout = null;
            }
        });
        it("should store the sample to a global variable for next time",() => {
            var oddSample = randomSampleGenerator(0); // Previous was 0, so the next one will be 1 (odd)

            // Call the function under test
            ourBoard._finalizeNewSampleForDaisy(oddSample);

            // Check to make sure the variable is stored
            expect(ourBoard._lowerChannelsSampleObject).to.equal(oddSample);
        });
        it("should emit a sample on even sample if odd was before", function(done) {
            var oddSample = randomSampleGenerator(0); // Previous was 0, so the next one will be 1 (odd)
            var evenSample = randomSampleGenerator(1); // Previous was 1, so the next one will be 2 (even)

            // The function to be called when sample event is fired
            var sampleEvent = (sample) => {
                // test pass here
                done();
            };

            // Subscribe to the sample event
            ourBoard.once("sample",sampleEvent);

            // Call the function under test twice
            ourBoard._finalizeNewSampleForDaisy(oddSample);
            ourBoard._finalizeNewSampleForDaisy(evenSample);

            // Set a timeout to end the function, after giving enough time for the sample to be emitted if were going to
            //  be
            failTimeout = setTimeout(() => {
                // Fail condition
                done("didn't emit a sample");
            }, 5); // 5ms should be plenty of time
        });
        it("should not emit a sample if there is no lower sample object and this is an even sample number", function(done) {
            var evenSample = randomSampleGenerator(1); // Previous was 1, so the next one will be 2 (even)

            // The function to be called when sample event is fired
            sampleEvent = (sample) => {
                // test fail condition
                done("emitted a sample");
            };

            console.log("_lowerChannelsSampleObject",ourBoard._lowerChannelsSampleObject);

            // Subscribe to the sample event
            ourBoard.once("sample",sampleEvent);

            // Call the function under test
            ourBoard._finalizeNewSampleForDaisy(evenSample);

            // Set a timeout to end the function, after giving enough time for the sample to be emitted if were going to
            //  be
            failTimeout = setTimeout(() => {
                // This is the condition where an odd was skipped so need to keep track of this as a missed packet
                expect(ourBoard.info.missedPackets).to.equal(1);
                done(); // Test pass here
            }, 5); // 5ms should be plenty of time
        });
        it("should not emit a sample if back to back odd samples", function(done) {
            var oddSample1 = randomSampleGenerator(0); // Previous was 0, so the next one will be 1 (odd)
            var oddSample2 = randomSampleGenerator(2); // Previous was 0, so the next one will be 1 (odd)

            // The function to be called when sample event is fired
            sampleEvent = (sample) => {
                // test fail condition
                done("emitted a sample");
            };

            // Subscribe to the sample event
            ourBoard.once("sample",sampleEvent);

            // Call the function under test twice
            ourBoard._finalizeNewSampleForDaisy(oddSample1);
            ourBoard._finalizeNewSampleForDaisy(oddSample2);

            // Set a timeout to end the function, after giving enough time for the sample to be emitted if were going to
            //  be
            failTimeout = setTimeout(() => {
                // This is the condition where an even was skipped so need to keep track of this as a missed packet
                expect(ourBoard.info.missedPackets).to.equal(1);
                ourBoard.removeListener("sample",sampleEvent);
                done(); // Test pass here
            }, 5); // 5ms should be plenty of time
        });
    });

    describe('#usingVersionTwoFirmware',function () {
        it("should return true if firmware is version 2",() => {
            ourBoard = new openBCIBoard.OpenBCIBoard();
            ourBoard.info.firmware = 'v2';

            expect(ourBoard.usingVersionTwoFirmware()).to.be.true;
        });
        it("should return false if not firmware version 2",() => {
            ourBoard = new openBCIBoard.OpenBCIBoard();

            expect(ourBoard.usingVersionTwoFirmware()).to.be.false;
        });

    });

    describe('#radioChannelSet', function() {
        afterEach(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                }).catch(() => done);
            } else {
                done()
            }
        });

        it("should not change the channel number if not connected", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.radioChannelGet().should.be.rejected.and.notify(done);
        });

        it("should reject if streaming", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.streamStart()
                            .then(() => {
                                ourBoard.radioChannelSet(1).then(() => {
                                    done("should have rejected");
                                }).catch(() => {
                                    done(); // Test pass
                                })
                            }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
        it("should reject if not firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSet(1).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });
        it("should reject if a number is not sent as input", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSet('1').should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should reject if no channel number is presented as arg", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSet().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should reject if the requested new channel number is lower than 0", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSet(-1).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should reject if the requested new channel number is higher than 25", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSet(26).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should not change the channel if the board is not communicating with the host", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorBoardFailure: true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSet(1).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should change the channel if connected, not steaming, and using firmware version 2+",function(done) {
            var newChannelNumber = 2;
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSet(newChannelNumber).then(channelNumber => {
                            expect(channelNumber).to.be.equal(newChannelNumber);
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
    });
    describe('#radioChannelSetHostOverride', function() {
        afterEach(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                }).catch(() => done);
            } else {
                done()
            }
        });
        it("should not change the channel number if not connected", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.radioChannelSetHostOverride().should.be.rejected.and.notify(done);
        });
        it("should reject if streaming", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.streamStart()
                            .then(() => {
                                ourBoard.radioChannelSetHostOverride(1).then(() => {
                                    done("should have rejected");
                                }).catch(() => {
                                    done(); // Test pass
                                })
                            }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
        it("should reject if a number is not sent as input", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSetHostOverride('1').should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });
        it("should reject if no channel number is presented as arg", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSetHostOverride().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });
        it("should reject if the requested new channel number is lower than 0", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSetHostOverride(-1).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });
        it("should reject if the requested new channel number is higher than 25", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSetHostOverride(26).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });
        it("should change the channel if connected, not steaming, and using firmware version 2+",function(done) {
            var newChannelNumber = 2;
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelSetHostOverride(newChannelNumber).then(channelNumber => {
                            expect(channelNumber).to.be.equal(newChannelNumber);
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
    });
    describe('#radioChannelGet', function() {
        afterEach(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                }).catch(() => done);
            } else {
                done()
            }
        });

        it("should not query if not connected", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.radioChannelGet().should.be.rejected.and.notify(done);
        });
        it("should not query if streaming", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.streamStart()
                            .then(() => {
                                ourBoard.radioChannelGet().then(() => {
                                    done("should have rejected");
                                }).catch(() => {
                                    done(); // Test pass
                                })
                            }).catch(err => done(err));
                    });
                }).catch(err => done(err));

        });
        it("should not query if not firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelGet().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));

        });
        it("should query if firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelGet().then(res => {
                            expect(res.channelNumber).to.be.within(k.OBCIRadioChannelMin,k.OBCIRadioChannelMax);
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
        it("should get message even if the board is not communicating with dongle", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorBoardFailure: true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioChannelGet().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });
    });

    describe("#radioPollTimeSet",function() {
        afterEach(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                }).catch(() => done);
            } else {
                done()
            }
        });
        it("should not change the channel number if not connected", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.radioPollTimeSet().should.be.rejected.and.notify(done);
        });

        it("should reject if streaming", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.streamStart()
                            .then(() => {
                                ourBoard.radioPollTimeSet(1).then(() => {
                                    done("should have rejected");
                                }).catch(() => {
                                    done(); // Test pass
                                })
                            }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });

        it("should reject if not firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeSet(1).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should reject if a number is not sent as input", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeSet('1').should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));

        });

        it("should reject if no poll time is presented as arg", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeSet().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should reject if the requested new poll time is lower than 0", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeSet(-1).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should reject if the requested new poll time is higher than 255", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeSet(256).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should not change the poll time if the board is not communicating with the host", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorBoardFailure: true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeSet(1).should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });

        it("should change the poll time if connected, not steaming, and using firmware version 2+",function(done) {
            var newPollTime = 69;
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeSet(newPollTime).then(() => {done()}).catch(err => done);
                    });
                }).catch(err => done(err));
        });
    });

    describe('#radioPollTimeGet', function() {
        afterEach(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                }).catch(() => done);
            } else {
                done()
            }
        });

        it("should not query if not connected", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.radioPollTimeGet().should.be.rejected.and.notify(done);
        });
        it("should not query if streaming", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.streamStart()
                            .then(() => {
                                ourBoard.radioPollTimeGet().then(() => {
                                    done("should have rejected");
                                }).catch(() => {
                                    done(); // Test pass
                                })
                            }).catch(err => done(err));
                    });
                }).catch(err => done(err));

        });
        it("should not query if not firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeGet().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));

        });
        it("should query if firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeGet().then(pollTime => {
                            expect(pollTime).to.be.greaterThan(0);
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
        it("should get failure message if the board is not communicating with dongle", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorBoardFailure: true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioPollTimeGet().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));
        });
    });

    describe('#radioBaudRateSet', function() {
        afterEach(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                }).catch(() => done);
            } else {
                done()
            }
        });

        it("should not try to set baud rate if not connected", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.radioBaudRateSet('default').should.be.rejected.and.notify(done);
        });
        it("should reject if no input", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.radioBaudRateSet().should.be.rejected.and.notify(done);
        });
        it("should be rejected if input type incorrect", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.radioBaudRateSet(1).should.be.rejected.and.notify(done);
        });
        it("should not try to change the baud rate if streaming", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.streamStart()
                            .then(() => {
                                ourBoard.radioBaudRateSet('default').then(() => {
                                    done("should have rejected");
                                }).catch(() => {
                                    done(); // Test pass
                                })
                            }).catch(err => done(err));
                    });
                }).catch(err => done(err));

        });
        it("should not try to change the baud rate if not firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioBaudRateSet('default').should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));

        });
        it("should set the baud rate to default if firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioBaudRateSet('default').then(baudrate => {
                            expect(baudrate).to.be.equal(115200);
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
        it("should set the baud rate to fast if firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioBaudRateSet('fast').then(baudrate => {
                            expect(baudrate).to.be.equal(230400);
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
    });

    describe('#radioSystemStatusGet', function() {
        afterEach(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                }).catch(() => done);
            } else {
                done()
            }
        });

        it("should not get system status if not connected", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.radioSystemStatusGet().should.be.rejected.and.notify(done);
        });
        it("should not get system status if streaming", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.streamStart()
                            .then(() => {
                                ourBoard.radioSystemStatusGet().then(() => {
                                    done("should have rejected");
                                }).catch(() => {
                                    done(); // Test pass
                                })
                            }).catch(err => done(err));
                    });
                }).catch(err => done(err));

        });
        it("should not get system status if not firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioSystemStatusGet().should.be.rejected.and.notify(done);
                    });
                }).catch(err => done(err));

        });
        it("should get up system status if firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2'
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioSystemStatusGet().then(isUp => {
                            expect(isUp).to.be.true;
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
        it("should get down system status if firmware version 2", function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose : true,
                simulate : true,
                simulatorFirmwareVersion: 'v2',
                simulatorBoardFailure: true
            });
            ourBoard.connect(k.OBCISimulatorPortName)
                .then(() => {
                    ourBoard.once('ready', () => {
                        ourBoard.radioSystemStatusGet().then(isUp => {
                            expect(isUp).to.be.false;
                            done();
                        }).catch(err => done(err));
                    });
                }).catch(err => done(err));
        });
    });

    describe('#radioTestsWithBoard',function() {
        this.timeout(3000);
        before(function(done) {
            ourBoard = new openBCIBoard.OpenBCIBoard({
                verbose: true
            });
            ourBoard.connect(masterPortName).catch(err => done(err));

            ourBoard.once('ready', () => {
                done();
            });
        });
        after(function(done) {
            if (ourBoard.connected) {
                ourBoard.disconnect().then(() => {
                    done();
                });
            } else {
                done()
            }
        });
        it("should be able to get the channel number", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            // The channel number should be between 0 and 25. Those are hard limits.
            ourBoard.radioChannelGet().then(res => {
                expect(res.channelNumber).to.be.within(0,25);
                done();
            }).catch(err => done(err));
        });
        it("should be able to set the channel to 1", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioChannelSet(1).then(channelNumber => {
                expect(channelNumber).to.equal(1);
                done();
            }).catch(err => done(err));
        });
        it("should be able to set the channel to 2", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioChannelSet(2).then(channelNumber => {
                expect(channelNumber).to.equal(2);
                done();
            }).catch(err => done(err));
        });
        it("should be able to set the channel to 25", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioChannelSet(25).then(channelNumber => {
                expect(channelNumber).to.equal(25);
                done();
            }).catch(err => done(err));
        });
        it("should be able to set the channel to 0", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioChannelSet(0).then(channelNumber => {
                expect(channelNumber).to.equal(0);
                done();
            }).catch(err => done(err));
        });
        it("should be able to override host channel number, verify system is down, set the host back and verify system is up", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            var systemChanNumber = 0;
            var newChanNum = 0;
            // Get the current system channel
            ourBoard.radioChannelGet()
                .then(res => {
                    // Store it
                    systemChanNumber = res.channelNumber;
                    if (systemChanNumber == 25) {
                        newChanNum = 24;
                    } else {
                        newChanNum = systemChanNumber + 1;
                    }
                    // Call to change just the host
                    return ourBoard.radioChannelSetHostOverride(newChanNum);
                })
                .then(newChanNumActual => {
                    expect(newChanNumActual).to.equal(newChanNum);
                    return ourBoard.radioSystemStatusGet();
                })
                .then(isUp => {
                    expect(isUp).to.be.false;
                    return ourBoard.radioChannelSetHostOverride(systemChanNumber); // Set back to good
                })
                .then(newChanNumActual => {
                    // Verify we set it back to normal
                    expect(newChanNumActual).to.equal(systemChanNumber);
                    return ourBoard.radioSystemStatusGet();
                })
                .then(isUp => {
                    expect(isUp).to.be.true;
                    done();
                })
                .catch(err => done(err));
        });
        it("should be able to get the poll time", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioPollTimeGet().should.eventually.be.greaterThan(0).and.notify(done);
        });
        it("should be able to set the poll time", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioPollTimeSet(80).should.become(80).and.notify(done);
        });
        it("should be able to change to default baud rate", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioBaudRateSet('default').should.become(115200).and.notify(done);
        });
        it("should be able to change to fast baud rate", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioBaudRateSet('fast').then(newBaudRate => {
                expect(newBaudRate).to.equal(230400);
                return ourBoard.radioBaudRateSet('default');
            }).then(() => {
                done();
            }).catch(err => done(err));
        });
        it("should be able to set the system status", function(done) {
            // Don't test if not using real board
            if (!realBoard) return done();
            ourBoard.radioSystemStatusGet().then(isUp => {
                expect(isUp).to.be.true;
                done();
            }).catch(err => done(err));
        });
    });

    describe('#hardwareValidation', function() {
        this.timeout(20000); // long timeout for pleanty of stream time :)
        var runHardwareValidation = true;
        var wstream;
        var board;
        before(function(done) {
            if (masterPortName === k.OBCISimulatorPortName) {
                runHardwareValidation = false;
            }
            if (runHardwareValidation) {
                board = new openBCIBoard.OpenBCIBoard({
                    verbose:true
                });
                // Use the line below to output the
                wstream = fs.createWriteStream('hardwareVoltageOutputAll.txt');

                board.connect(masterPortName)
                    .catch(err => done(err));

                board.once('ready',() => {
                    done();
                });

            } else {
                done();
            }

        });
        after(function() {
            if (runHardwareValidation) {
                board.disconnect();
            }
        });
        it('test all output signals', function(done) {
            if (runHardwareValidation) {
                board.streamStart()
                    .then(() => {
                        console.log('Started stream');
                        console.log('--------');

                    })
                    .catch(err => done(err));

                setTimeout(() => {
                    console.log('*-------');
                    board.testSignal('pulse1xSlow');
                },3000);
                setTimeout(() => {
                    console.log('**------');
                    board.testSignal('pulse2xSlow');
                },5000);
                setTimeout(() => {
                    console.log('***-----');
                    board.testSignal('pulse1xFast');
                },7000);
                setTimeout(() => {
                    console.log('****----');
                    board.testSignal('pulse2xFast');
                },9000);
                setTimeout(() => {
                    console.log('*****---');
                    board.testSignal('none');
                },11000);
                setTimeout(() => {
                    console.log('******--');
                    board.testSignal('pulse1xSlow');
                },13000);
                setTimeout(() => {
                    console.log('*******-');
                    board.testSignal('none');
                },15000);


                board.on('sample', sample => {
                    openBCISample.samplePrintLine(sample)
                        .then(line => {
                            wstream.write(line);
                        });
                });
                // This stops the test
                setTimeout(() => {
                    console.log('********');
                    done();
                },19000);
            } else {
                done();
            }
        });
    });

});

describe('#daisy', function () {
    var ourBoard;
    this.timeout(4000);
    before(function (done) {
        ourBoard = new openBCIBoard.OpenBCIBoard({
            verbose:true,
            simulatorFirmwareVersion: 'v2',
            simulatorDaisyModuleAttached: true,
        });

        var useSim = () => {
            ourBoard.simulatorEnable()
                .then(() => {
                    console.log(`has daisy module: ${ourBoard.options.simulatorDaisyModuleAttached}`);
                    return ourBoard.connect(k.OBCISimulatorPortName);
                })
                .then(() => {
                    return ourBoard.softReset();
                })
                .catch(err => console.log(err));
        };
        ourBoard.autoFindOpenBCIBoard()
            .then(portName => {
                return setTimeout(() => {
                    console.log('Issuing connect');
                    ourBoard.connect(portName);
                },500);
            })
            .catch((err) => {
                useSim();
            })
            .then(() => {
                //console.log('connected');
            })
            .catch(err => {
                console.log('Error: ' + err);
            });


        ourBoard.once('ready', () => {
            done();
        });
    });
    after(function(done) {
        if (ourBoard.connected) {
            ourBoard.disconnect().then(() => {
                done();
            }).catch(() => done);
        } else {
            done();
        }
    });
    it("can get samples with channel array of length 16 if daisy", function(done) {
        var numberOfSamples = 130;
        var sampleCount = 0;

        if (ourBoard.info.boardType !== k.OBCIBoardDaisy) {
            done();
        }
        var samp = sample => {
            expect(sample.channelData.length).to.equal(k.OBCINumberOfChannelsDaisy);
            if (sampleCount <= numberOfSamples) {
                sampleCount++;
            } else {
                ourBoard.disconnect()
                    .then(() => {
                        done();
                    });
                ourBoard.removeListener('sample',samp);
            }
        };
        ourBoard.on('sample',samp);
        ourBoard.streamStart().catch(err => done);
        // Attached the emitted
    });
});

describe('#sync', function() {
    var ourBoard;
    this.timeout(4000);
    before(function (done) {
        ourBoard = new openBCIBoard.OpenBCIBoard({
            verbose:true,
            simulatorFirmwareVersion: 'v2'
        });

        var useSim = () => {
            ourBoard.simulatorEnable()
                .then(() => {
                    console.log(`sim firmware version: ${ourBoard.options.simulatorFirmwareVersion}`);
                    return ourBoard.connect(k.OBCISimulatorPortName);
                })
                .then(() => {
                    return ourBoard.softReset();
                })
                .catch(err => console.log(err));
        };
        ourBoard.autoFindOpenBCIBoard()
            .then(portName => {
                return setTimeout(() => {
                    console.log('Issuing connect');
                    ourBoard.connect(portName);
                },500);
            })
            .catch((err) => {
                useSim();
            })
            .then(() => {
                //console.log('connected');
            })
            .catch(err => {
                console.log('Error: ' + err);
            });


        ourBoard.once('ready', () => {
            ourBoard.streamStart()
                .then(() => {
                    done();
                })
                .catch(err => done);
        });
    });
    after(function(done) {
        if (ourBoard.connected) {
            ourBoard.disconnect().then(() => {
                done();
            }).catch(() => done);
        } else {
            done();
        }
    });
    afterEach(() => {
        this.buffer = null;
    });
    describe('#syncClocks', function() {
        it('can sync while streaming', done => {
            var syncAfterSamples = 50;
            var notSynced = true;
            var samp = sample => {
                if (sample.sampleNumber >= syncAfterSamples && notSynced) {
                    notSynced = false;
                    // Call the first one
                    ourBoard.syncClocks().catch(err => done);
                }
            };
            ourBoard.on('sample',samp);
            // Attached the emitted
            ourBoard.once('synced',obj => {
                console.log('syhnc obj', obj);
                ourBoard.removeListener('sample',samp);
                done();
            });
        });
    });
    describe('#syncClocksFull', function() {
        it('can run a full clock sync', done => {
            var notSynced = true;
            var sampleFun = sample => {
                console.log('sample',sample);

                if (notSynced) {
                    notSynced = false;
                    // Call the first one
                    ourBoard.syncClocksFull()
                        .then(syncObj => {
                            console.log(syncObj);
                            if (syncObj.valid) {
                                done();
                            } else {
                                done("Not able to sync");
                            }
                        }).catch(err => done);
                }
            };
            ourBoard.on('sample',sampleFun);
        });
    });
});

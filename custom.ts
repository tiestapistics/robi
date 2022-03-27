const cm = 1;
const mm = 0.1 * cm;

const M1 = 0;
const M2 = 1;

// ---

namespace Math {
    export function roundDecimal(a: number, b: number = 2): string {
        const pow = Math.pow(10, b);
        const str = '' + (Math.round(a * pow) / pow)
        const pos = str.indexOf('.');

        if (pos < 0) return str;
        return str.substr(0, pos + 1 + b);
    }

    export function takeSign(a: number) {
        return ((Math.sign(a) >= 0) ? 1 : -1);
    }

    export function between(v: number, a: number, b: number): boolean {
        return (v >= a) && (v < b);
    }
}

//% weight=100 color=#00ff00 icon=''
namespace Test {
    export let assert = 0;

    function assertNew(actual: string): void {
        assert++;
        debug('assertEquals(' + assert + '): ' + actual);
    }

    function assertError(error: string[], str?: string): void {
        error.insertAt(0, '>> ASSERTION ' + assert + ' <<')

        if (str) error.insertAt(1, str);

        let pos = 3;

        brick.clearScreen();
        error.forEach(function (value: string, index: number) {
            debug(value);
            brick.showString(value, pos++);
        })

        brick.setStatusLight(StatusLight.RedPulse);
        music.playSoundEffect(sounds.informationError);
        pause(5 * 1000);
        music.stopAllSounds();
    }

    //% block
    export function assertEquals(exprected: number, actual: number, str?: string) {
        assertNew('' + Math.roundDecimal(actual, 2));
        if (actual == exprected) return;
        assertError([
            'assert found: ' + Math.roundDecimal(actual, 2),
            'expected: ' + Math.roundDecimal(exprected, 2)
        ], str);
    }

    //% block
    export function assertTrue(actual: boolean, str?: string) {
        assertNew('' + actual);
        if (actual == true) return;
        assertError([
            'assert found: ' + actual,
            'expected: ' + true
        ], str);
    }
}

// ---

let logger: string[] = [];

let DEBUG = false;

function debug(str: string): void {
    if (DEBUG) {
        logger.push(str);
    }
}

let loggerLastTimestamp: number = 0;
function debugTS(log: string): void {
    const timestamp = control.millis();
    debug('' + timestamp + ' (' + (timestamp - loggerLastTimestamp) + '): ' + log);

    loggerLastTimestamp = timestamp;
}

// ---

namespace Helper {
    // -180...180
    export function normAngle(a: number): number {
        return (((a % 360) + 360 + 180) % 360) - 180;
    }

    export function TESTnormAngle(): void {
        Test.assert = 0;

        Test.assertEquals(+179, Helper.normAngle(+179));
        Test.assertEquals(+0, Helper.normAngle(0));
        Test.assertEquals(-179, Helper.normAngle(-179));

        Test.assertEquals(-180, Helper.normAngle(+180));
        Test.assertEquals(-180, Helper.normAngle(-180));

        Test.assertEquals(-178, Helper.normAngle(+182));
        Test.assertEquals(+178, Helper.normAngle(-182));

        Test.assertEquals(+1, Helper.normAngle(-359));
        Test.assertEquals(-1, Helper.normAngle(-361));
    }

    // ---

    export function speed(pos: number, len: number, vIn: number, vMax: number, vOut: number): number {
        let sign: number = Math.takeSign(vMax);

        if (vMax == 0) {
            return 0;
        }

        if (Math.takeSign(vIn) != sign) {
            vIn = 0;
        }

        if (Math.takeSign(vOut) != sign) {
            vOut = 0;
        }

        pos = Math.abs(pos);
        len = Math.abs(len);

        vIn = Math.abs(vIn);
        vMax = Math.abs(vMax);
        vOut = Math.abs(vOut);

        // ---

        /*
               /---   <= vMax
              /
             /
            /
        ---/          <= vIn
        ___
           |len|
        */
        let ramp1_len: number = Math.abs((vMax - vIn) / hardware.motorConfig.speedChange);
        let ramp1_pos: number = pos;
        let ramp1_f: number = ramp1_pos / ramp1_len;
        let ramp1_v: number = vIn + (ramp1_f * (vMax - vIn));
        ramp1_v = Math.min(ramp1_v, vMax);
        ramp1_v = Math.max(ramp1_v, vIn);
        ramp1_v = Math.max(ramp1_v, hardware.motorConfig.minSpeed);

        /*
        ---\          <= vMax
            \
             \
              \
               \---   <= vOut
        ___
           |len|
        */
        let ramp2_len: number = Math.abs((vOut - vMax) / hardware.motorConfig.speedChange);
        let ramp2_pos: number = pos - (len - ramp2_len);
        let ramp2_f: number = ramp2_pos / ramp2_len;
        let ramp2_v: number = vMax - (ramp2_f * (vMax - vOut));
        ramp2_v = Math.min(ramp2_v, vMax);
        ramp2_v = Math.max(ramp2_v, vOut);
        ramp2_v = Math.max(ramp2_v, hardware.motorConfig.minSpeed);

        // ---

        return sign * Math.min(ramp1_v, ramp2_v);
    }

    export function TESTspeed(): void {
        Test.assert = 0;

        // Helper.speed(pos: number, len: number, vIn: number, vMax: number, vOut: number)

        Test.assertEquals(+hardware.motorConfig.minSpeed, Helper.speed(0, 50, 0, +100, 0));
        Test.assertEquals(-hardware.motorConfig.minSpeed, Helper.speed(0, 50, 0, -100, 0));

        Test.assertEquals(+hardware.motorConfig.minSpeed, Helper.speed(50, 50, 0, +100, 0));
        Test.assertEquals(-hardware.motorConfig.minSpeed, Helper.speed(50, 50, 0, -100, 0));

        // ---

        Test.assertEquals(+15, Helper.speed(0, 50, +15, +100, +30));
        Test.assertEquals(-15, Helper.speed(0, 50, -15, -100, -30));

        Test.assertEquals(+50, Helper.speed(25, 50, 0, +100, 0));
        Test.assertEquals(-50, Helper.speed(25, 50, 0, -100, 0));

        Test.assertEquals(+30, Helper.speed(50, 50, 0, +100, +30));
        Test.assertEquals(-30, Helper.speed(50, 50, 0, -100, -30));
    }
}

//% weight=130 color=#ff0000 icon=''
namespace hardware {
    let gyro: sensors.GyroSensor = null;
    let gyroInverse: boolean = false

    //% block
    export function setGyroSensor(gyroSensor: sensors.GyroSensor, inverse: boolean=false): void {
        gyro = gyroSensor;
        gyroInverse = inverse;

        gyro.setMode(GyroSensorMode.Angle);

        // gyroReset();
    }

    //% block
    export function gyroReset(): void {
        if (gyro == null) return;

        if (control.deviceFirmwareVersion() != 'vSIM') {
            music.setVolume(20)

            let freq = music.noteFrequency(Note.C);
            music.ringTone(freq * 2)
        }

        // motors.stopAll();
        hardware.motorConfig.stop();
        robi.stop('GYRO RESET');

        pause(1 * 1000);

        brick.showString('Calibrating Gyro', 1)

        for (let count = 0; count < 10; count++) {
            brick.showString('ID: ' + gyro.id(), 3)

            brick.showString('Calibrate:' + (count + 1), 5)
            gyro.calibrate();

            brick.showString('Drift: ' + gyro.drift(), 7)

            if (gyro.isCalibrating()) continue;
            if (gyro.drift() == 0) break;
        }

        music.stopAllSounds()
    }

    //% block
    export function readGyroAngle(): number {
        if (gyro == null) return 0;
        let angle: number = gyro.angle();
        if (gyroInverse) angle *= -1;
        return angle
    }

    // ---

    let color: sensors.ColorSensor = null;

    //% block
    export function setColorSensor(colorSensor: sensors.ColorSensor, mode: ColorSensorMode = null): void {
        color = colorSensor;

        if (mode == null) mode = ColorSensorMode.RgbRaw;
        color.setMode(mode);
    }

    //% block
    export function readColor(): number[] {
        if (color == null) return [-1, -1, -1];
        return color.rgbRaw();
    }

    // ---

    export let motorConfig: MotorConfig;

    class MotorConfig {
        protected motorSync: motors.SynchedMotorPair;
        protected motor: motors.Motor[];

        public minSpeed: number;
        public speedChange: number;

        private wheel: number;
        private width: number;

        protected M1_M2_swap: boolean;
        protected M1_M2_direction: boolean;
        protected M1_inverse: boolean;
        protected M2_inverse: boolean;

        angle2cm(a: number): number {
            return a / 360.0 * this.wheelCircumference()
        }

        cm2angle(cm: number): number {
            return cm / this.wheelCircumference() * 360;
        }

        wheelCircumference(): number {
            // wheel is diameter
            return this.wheel * Math.PI;
        }

        turningCircle(): number {
            // with is radius
            return this.width * Math.PI * 2;
        }

        constructor(motorSync: motors.SynchedMotorPair, motorM1: motors.Motor, motorM2: motors.Motor, wheel: number, width: number, M1_M2_swap: boolean = false, M1_M2_direction: boolean = false, M1_inverse: boolean = false, M2_inverse: boolean = false) {
            this.minSpeed = 5;
            this.speedChange = 2;

            this.motorSync = motorSync;
            this.wheel = wheel;
            this.width = width;
            this.M1_M2_swap = M1_M2_swap;
            this.M1_M2_direction = M1_M2_direction;
            this.M1_inverse = M1_inverse;
            this.M2_inverse = M2_inverse;

            this.motor = [];
            this.motor[M1] = motorM1;
            this.motor[M2] = motorM2;

            let motorStr: string = this.motorSync.toString();
            let motorM1Str: string = this.motor[M1].toString();
            let motorM2Str: string = this.motor[M2].toString();

            Test.assertTrue(motorM1Str[0] == motorStr[0], "Motor1 not Equal");
            Test.assertTrue(motorM2Str[0] == motorStr[2], "Motor2 not Equal");

            this.reset();
        }

        stop(): void {
            // motors.stopAll();

            this.motorSync.stop();

            this.lastSpeed = 0;
            this.lastSteering = 0;
        }

        reset(): void {
            this.stop();

            this.motorSync.setRegulated(true);

            this.motor[M1].setBrakeSettleTime(500);
            this.motor[M2].setBrakeSettleTime(500);
            this.motorSync.setBrake(true);

            this.motor[M1].clearCounts();
            this.motor[M2].clearCounts();
        }

        swapDirections(valueM1: number, valueM2: number) {
            let ret: number[] = [];

            // Motoren M1 und M2 vertauschen
            if (this.M1_M2_swap) {
                ret[M1] = valueM2;
                ret[M2] = valueM1;
            } else {
                ret[M1] = valueM1;
                ret[M2] = valueM2;
            }

            // Richtung vertauschen
            if (this.M1_inverse) ret[M1] *= -1;
            if (this.M2_inverse) ret[M2] *= -1;

            if (this.M1_M2_direction) {
                ret[M1] *= -1;
                ret[M2] *= -1;
            }

            return ret;
        }

        readMotorPosition(): number[] {
            return this.swapDirections(
                this.angle2cm(this.motor[M1].angle()),
                this.angle2cm(this.motor[M2].angle()),
            );
        }

        readMotorSpeed(): number[] {
            return this.swapDirections(
                this.motor[M1].speed(),
                this.motor[M2].speed(),
            );
        }

        protected lastSpeed: number;
        protected lastSteering: number;
        setMotorPosition(speed: number, steering: number): void {
            if ((this.lastSpeed != speed) || (this.lastSteering != steering)) {
                if (speed != 0) {
                    speed = Math.takeSign(speed) * Math.max(Math.abs(speed), Math.abs(this.minSpeed)); // Min Speed

                    let direction = (this.M1_M2_direction) ? -1 : 1;

                    this.motorSync.steer(steering, direction * speed)
                    this.motorSync.isReady()
                } else {
                    this.motorSync.stop();
                    speed = 0
                    steering = 0
                }

                debugTS(Math.roundDecimal(speed) + '/' + Math.roundDecimal(steering));

                this.lastSpeed = speed
                this.lastSteering = steering
            }
        }

        releaseBreaks() {
            this.motorSync.setBrake(false);
            this.motorSync.stop();
        }
    }

    //% block
    export function setMotor(motorSync: motors.SynchedMotorPair, motorM1: motors.Motor, motorM2: motors.Motor, wheel: number, width: number, M1_M2_swap: boolean = false, M1_M2_direction: boolean = false, M1_inverse: boolean = false, M2_inverse: boolean = false): void {
        motorConfig = new MotorConfig(motorSync, motorM1, motorM2, wheel, width, M1_M2_swap, M1_M2_direction, M1_inverse, M2_inverse);
    }

    //% block
    export function releaseBreaks(): void {
        motorConfig.releaseBreaks();
    }
}

//% weight=120 color=#ff00aa icon=''
namespace robi {
    const ramp = 50 * cm;

    export enum FollowLineType {
        left    = 0, // black is on the left side
        right   = 1, // black is on the right side
    }

    class MotorAction {
        protected name: string;
        protected actionSpeed: number;

        public rawPos: number[];
        public offsetPos: number[];

        protected currentPos: number[];
        protected targetPos: number[];

        protected lastSpeed: number;
        protected currentSpeed: number[];
        protected targetSpeed: number;

        protected lastSteering: number;
        protected currentSteering: number;
        protected targetSteering: number;

        constructor(name: string, targetSpeed: number = 0, targetPos: number[] = null) {
            if (targetPos == null) targetPos = [0, 0];

            // ---

            this.name = name;
            this.actionSpeed = 0;

            this.rawPos = [0, 0];
            this.offsetPos = [0, 0];

            this.currentPos = [0, 0];
            this.targetPos = targetPos;

            this.lastSpeed = 0;
            this.currentSpeed = [0, 0];
            this.targetSpeed = targetSpeed;

            this.lastSteering = 0;
            this.currentSteering = 0;
            this.targetSteering = this.calcSteering(this.targetPos[M1], this.targetPos[M2])
        }

        public toString(): string {
            return this.infoAction();
        }

        public infoAction(): string {
            return '' + this.name + ' (' + Math.round(this.percentage()) + '%/' + Math.round(this.angle()) + '*)';
        }

        public info(): void {
            brick.showString('' + currentAction + ' / ' + (actions.length - 1), 1)

            const min = Math.max(currentAction - 3, 0);
            for (let i = 0; i < 5; i++) {
                const index = min + i;

                if (index < actions.length) {
                    brick.showString('' + ((currentAction == index) ? '>' : ' ') + index + ':' + actions[index].toString(), 2 + i)
                } else {
                    brick.showString('', 2 + i)
                }
            }

            brick.showString('      M1: ' + Math.roundDecimal(this.targetPos[M1]) + '/' + Math.roundDecimal(this.currentPos[M1]), 8)
            brick.showString('      M2: ' + Math.roundDecimal(this.targetPos[M2]) + '/' + Math.roundDecimal(this.currentPos[M2]), 9)
            brick.showString('Steering: ' + Math.roundDecimal(this.getSteering()) + '/' + Math.roundDecimal(this.currentSteering), 10)
            brick.showString('   Speed: ' + Math.round(this.actionSpeed) + '/' + Math.round(this.currentSpeed[M1]) + '|' + Math.round(this.currentSpeed[M2]), 11)
        }

        public getActionSpeed(): number {
            return this.actionSpeed;
        }

        public getTargetSpeed(): number {
            return this.targetSpeed;
        }

        public getSpeed(): number {
            let maxDistance = this.maxDistance();
            let maxTotal = this.maxTotal();

            let vIn: number = getPrevSpeed();
            let vMax: number = this.targetSpeed;
            let vOut: number = getNextSpeed();

            this.actionSpeed = Helper.speed(maxDistance, maxTotal, vIn, vMax, vOut);

            brick.showString('  Action: ' + Math.round(vIn) + '/' + vMax + '/' + vOut, 7);

            return this.actionSpeed;
        }

        public getSteering(): number {
            let steering = this.targetSteering;

            let corr = (this.currentSteering - this.targetSteering);
            if (Math.abs(corr) < Math.abs(steering) * 0.30) {
                steering -= corr / 2;
            }

            return steering;
        }

        public checkPosition(): boolean {
            let oldPos = this.rawPos;

            this.rawPos = hardware.motorConfig.readMotorPosition();
            this.currentSpeed = hardware.motorConfig.readMotorSpeed();

            let pos: number[] = [];
            pos[M1] = this.rawPos[M1] - this.offsetPos[M1];
            pos[M2] = this.rawPos[M2] - this.offsetPos[M2];
            this.currentPos = pos;

            this.currentSteering = this.calcSteering(this.currentPos[M1], this.currentPos[M2]);

            return (this.percentage() >= 100);
        }

        // ---

        // gefahrene Strecke (in cm)
        public distance(): number {
            return (
                (this.currentPos[M1])
                +
                (this.currentPos[M2])
            ) / 2
        }

        // noch zu fahrenden Strecke (in cm)
        public target(): number {
            return (
                (this.targetPos[M1] - this.currentPos[M1])
                +
                (this.targetPos[M2] - this.currentPos[M2])
            ) / 2
        }

        public getTargetPosM1(): number {
            return this.targetPos[M1];
        }

        public getTargetPosM2(): number {
            return this.targetPos[M2];
        }

        public maxDistance(): number {
            if (Math.abs(this.targetPos[M1]) >= Math.abs(this.targetPos[M2])) {
                return Math.abs(this.currentPos[M1]);
            } else {
                return Math.abs(this.currentPos[M2]);
            }
        }

        public maxTotal(): number {
            if (Math.abs(this.targetPos[M1]) >= Math.abs(this.targetPos[M2])) {
                return Math.abs(this.targetPos[M1]);
            } else {
                return Math.abs(this.targetPos[M2]);
            }
        }

        // Prozent der zurückgelegten Strecke 0..100
        public percentage(): number {
            let maxDistance = this.maxDistance();
            let maxTotal = this.maxTotal();

            if (maxTotal == 0) return 100;
            return 100 * maxDistance / maxTotal;
        }

        // gefahrender Winkel (in Grad)
        public angle(): number {
            let bogen = this.currentPos[M2] - this.currentPos[M1];
            return (bogen * 360) / hardware.motorConfig.turningCircle()
        }

        public calcSteering(M1: number, M2: number): number {
            //    M1   M2 =>    %
            //
            //   100    0 =>  100
            //     0 -100 => -100
            //    50  100 =>   50
            //   100  100 =>    0
            //  -100  100 =>  200

            let sum = Math.max(
                Math.abs(M1),
                Math.abs(M2)
            );
            return (sum == 0) ? 0 : 100 * ((M1 / sum) - (M2 / sum))
        }

        protected directionCheck(): void {
            if (Math.abs(this.currentPos[M1]) < 1 * cm) return;
            if (Math.takeSign(this.currentPos[M1]) == Math.takeSign(this.targetPos[M1])) return;

            if (Math.abs(this.currentPos[M2]) < 1 * cm) return;
            if (Math.takeSign(this.currentPos[M2]) == Math.takeSign(this.targetPos[M2])) return;

            debug('ERROR: directionCheck failed');
            brick.setStatusLight(StatusLight.RedPulse);
        }

        public updateMotor(): void {
            this.lastSpeed = this.getSpeed();
            this.lastSteering = this.getSteering();

            this.directionCheck();

            hardware.motorConfig.setMotorPosition(this.lastSpeed, this.lastSteering);
        }
    }

    // ---

    //% block
    export function actionClean(): void {
        actions = [];
        stopActions = [];
    }

    //% block
    export function actionMove(distance: number): void {
        let speed = Math.takeSign(distance) * 100;
        actions.push(new MotorAction('Move', speed, [distance, distance]))
    }

    function prepareAngle(angle: number, distance: number, rotate: number = 0): number[] {
        let bogen: number = Helper.normAngle(angle) / 360 * hardware.motorConfig.turningCircle();

        let target: number[] = [];

        if (Math.abs(rotate) > 100) {
            rotate = Math.sign(rotate) * 100;
        }

        // rotate    p(M1)   p(M2)
        // -100       0       2
        //    0      -1       1
        //  100      -2       0

        let p1 = (rotate + 100) / 100 * -1;
        let p2 = (100 - rotate) / 100;

        /*
        debug('Angle: ' + angle + ' / ' + Helper.normAngle(angle));
        debug('Rotate: ' + p1 + ' / ' + p2);
        debug('Bogen: ' + bogen);
        */

        target[M1] = distance + (bogen / 2 * p1);
        target[M2] = distance + (bogen / 2 * p2);

        return target;
    }

    //% block
    export function actionRotate(angle: number, distance: number = 0, rotate: number = 0): void {
        let speed = Math.takeSign(distance) * 50;
        let targetPos = prepareAngle(angle, distance, rotate)
        actions.push(new MotorAction('Rotate', speed, targetPos))
    }

    class MotorActionFollowColor extends MotorAction {
        protected stearing: number;
        public follow: FollowLineType;

        getSteering(): number {
            const Faktor = 0;

            const Schwarz = 30;
            const Weiss = 90;

            const MaxStearing = 25;

            let RGB = hardware.readColor();
            let Helligkeit = (RGB[0] + RGB[1] + RGB[2]) / 3;
            Helligkeit = Math.min(Helligkeit, Weiss);
            Helligkeit = Math.max(Helligkeit, Schwarz);
            Helligkeit = (Helligkeit * 2 - Schwarz - Weiss) * (100 / (Weiss - Schwarz));
            debug('Helligkeit: ' + Helligkeit);

            if (this.stearing !== this.stearing) { // NaN
                this.stearing = 0
            }

            let newStearing: number = (Helligkeit - Schwarz) / (Weiss - Schwarz) * MaxStearing;
            newStearing *= (this.follow === FollowLineType.left) ? -1 : 1;

            if (this.targetSpeed < 0) newStearing *= -1;

            this.stearing = (this.stearing * Faktor) - (newStearing * (1 - Faktor))
            return this.stearing;
        }

        toString(): string {
            return this.infoAction();
        }
    }

    //% block
    export function actionFollowColor(distance: number, follow: FollowLineType = null): void {
        if (follow == null) follow = FollowLineType.right;

        let speed = Math.takeSign(distance) * 25;
        let motorAction = new MotorActionFollowColor('FollowC', speed, [distance, distance]);
        motorAction.follow = follow;
        actions.push(motorAction)
    }

    class MotorActionFollowGyro extends MotorAction {
        protected stearing: number;
        public gyroAngle: number;

        getSteering(): number {
            const Faktor = 0.2

            let gyroAngle = hardware.readGyroAngle();

            debug('gyroAngle: ' + gyroAngle);

            if (this.stearing !== this.stearing) { // NaN
                this.stearing = 0
            }

            const diffAngle = Helper.normAngle(Helper.normAngle(gyroAngle) - Helper.normAngle(this.gyroAngle))
            debug('diffAngle: ' + diffAngle);

            let newStearing = -diffAngle / 180 * 200
            debug('newStearing: ' + newStearing);

            if (this.targetSpeed < 0) newStearing *= -1;

            this.stearing = (this.stearing * Faktor) - (newStearing * (1 - Faktor));
            return this.stearing;
        }

        toString(): string {
            return this.infoAction();
        }
    }

    //% block
    export function actionFollowGyro(gyroAngle: number, distance: number): void {
        let speed = Math.takeSign(distance) * 40;
        let motorAction = new MotorActionFollowGyro('FollowG', speed, [distance, distance]);
        motorAction.gyroAngle = gyroAngle;
        actions.push(motorAction)
    }

    class MotorActionCallback extends MotorAction {
        protected callbackFn: (action?: string, n?: number, s?: string) => void;
        protected n: number;
        protected s: string;

        constructor(action: string, callbackFn: (action?: string, n?: number, s?: string) => void, n?: number, s?: string) {
            super(action, 0);

            this.callbackFn = callbackFn;
            this.n = n;
            this.s = s;
        }

        checkPosition(): boolean {
            this.callbackFn(this.name, this.n, this.s);

            return true;
        }

        toString(): string {
            let str: string = this.name;
            if (this.n) {
                str = str + ' ' + this.n;

                if (this.s) {
                    str = str + ' "' + this.s + '"';
                }
            }
            return str;
        }
    }

    //% block
    export function actionCallback(name: string, callbackFn: (action?: string, n?: number, s?: string) => void, n?: number, s?: string): void {
        actions.push(new MotorActionCallback(name, callbackFn, n, s))
    }

    // ---

    let stopActions: (() => void)[] = [];

    //% block
    export function actionOnExit(callbackFn: () => void): void {
        stopActions.push(callbackFn);
    }

    //% block
    export function actionStop(): void {
        actions.push(new MotorAction('stop', 0));
    }

    // ---

    let actions: MotorAction[] = []
    let currentAction: number = 0;

    function getPrevSpeed(): number {
        if (Math.between(currentAction - 1, 0, actions.length)) {
            let actionPrev: MotorAction = actions[currentAction - 1];

            return actionPrev.getActionSpeed();
        }
        return 0;
    }

    function getNextSpeed(): number {
        if (Math.between(currentAction, 0, actions.length)) {
            let actionCurrent: MotorAction = actions[currentAction];

            // ---

            if (Math.between(currentAction + 1, 0, actions.length)) {
                let actionNext: MotorAction = actions[currentAction + 1];

                if (
                    (Math.takeSign(actionCurrent.getTargetPosM1()) == Math.takeSign(actionNext.getTargetPosM1()))
                    &&
                    (Math.takeSign(actionCurrent.getTargetPosM2()) == Math.takeSign(actionNext.getTargetPosM2()))
                    &&
                    (Math.takeSign(actionCurrent.getTargetSpeed()) == Math.takeSign(actionNext.getTargetSpeed()))
                ) {
                    return actionNext.getTargetSpeed();
                }
            }
        }

        return 0;
    }

    export let run = false;
    export let live = true;

    //% block
    export function setLive(status: boolean): void {
        live = status;
    }

    //% block
    export function startProgram(): void {
        brick.setStatusLight(StatusLight.GreenPulse);
        hardware.motorConfig.reset();

        pause(500);

        debug('START Program');

        currentAction = 0;
        live = false;
        run = true;
    }

    //% block
    let lastStopTimestamp = 0;
    export function updateAction(): void {
        if (!run) {
            if (lastStopTimestamp > 0) {
                if ((control.millis() - lastStopTimestamp) > 5 * 60 * 1000) {
                    // Autorelease break after 5 min
                    lastStopTimestamp = 0;
                    hardware.releaseBreaks();
                }
            }
            return;
        }

        if (!Math.between(currentAction, 0, actions.length)) {
            run = false;
            debug('currentAction ' + currentAction + ' not between 0 and ' + actions.length);
            return;
        }

        let nextAction = actions[currentAction].checkPosition();
        actions[currentAction].info()

        if (nextAction) {
            debug('' + currentAction + ': ' + actions[currentAction].toString());

            let rawPos = actions[currentAction].rawPos;

            currentAction++;
            if (currentAction >= actions.length)
                currentAction = actions.length

            // ---

            if (currentAction >= actions.length) {
                stop('DONE');
                return;
            }

            actions[currentAction].rawPos = rawPos;
            actions[currentAction].offsetPos = rawPos;
        }

        actions[currentAction].updateMotor()
    }

    //% block
    export function updateGyro(): void {
        if (run) return;
        if (!live) return;

        let info: string = '';
        info += 'Akku: ' + brick.batteryLevel();
        info += ' / ';
        info += 'GYRO: ' + Helper.normAngle(hardware.readGyroAngle());
        brick.showString(info, 11)
    }

    //% block
    export function stop(msg: string = null): void {
        run = false;
        live = true;
        lastStopTimestamp = control.millis();

        // motors.stopAll();
        hardware.motorConfig.stop();

        stopActions.forEach(function (callbackFn: () => void) {
            callbackFn();
        });

        if (msg == null) msg = 'ABORT';

        debug(msg);
        brick.showString(' >> ' + msg + ' <<', 1)

        menu.setMenu('done');
        menu.showMenu()
        brick.setStatusLight(StatusLight.Orange)

        pause(500);
        hardware.motorConfig.stop();
    }
}

//% weight=110 color=#ff00ff icon=''
namespace menu {
    class MenuItem {
        public name: string;

        protected callbackFn: () => void;
        protected subMenu: string;

        constructor(name: string, callbackFn: () => void = null, subMenu: string = null) {
            if (subMenu == null) subMenu = 'done';

            this.name = name;
            this.callbackFn = callbackFn;
            this.subMenu = subMenu;
        }

        run(): void {
            if (this.callbackFn != null) {
                brick.clearScreen();
                this.callbackFn();
            }
        }

        setSubMenu(): void {
            setMenu(this.subMenu);
        }
    }

    //% block
    export function newMenu(typeName: string, name: string, callbackFn: () => void = null, subMenu: string = null): void {
        let menuTypeId = menuTypeNames.indexOf(typeName);
        menuTypes[menuTypeId].menus.push(new MenuItem(name, callbackFn, subMenu));
    }

    // ---

    let menuTypeNames: string[] = [];
    let menuTypes: MenuType[] = [];
    let menuTypeId = 0;

    export function setMenu(name: string = null): void {
        if (name == null) name = '';

        menuTypeId = menuTypeNames.indexOf(name);

        if (menuTypeId < 0) menuTypeId = 0;
        if (menuTypeId >= menuTypes.length) menuTypeId = 0;
    }

    //% block
    export function showMenu(): void {
        menuTypes[menuTypeId].show();
    }

    // ---

    export class MenuType {
        protected name: string;

        public menus: MenuItem[];
        protected menuPos: number;

        protected prevType: string;

        constructor(name: string) {
            this.name = name;

            this.menus = [];
            this.menuPos = 0;

            this.prevType = '';

            menuTypeNames.push(name);
            menuTypes.push(this);
        }

        show(): void {
            if (this.menuPos < 0)
                this.menuPos = this.menus.length - 1;

            if (this.menuPos > this.menus.length - 1)
                this.menuPos = 0;

            brick.clearScreen();

            const lines = 10;
            let min = Math.max(this.menuPos - Math.round(lines / 2), 0)
            for (let i = 0; i < Math.min(this.menus.length, lines); i++) {
                let index = min + i;

                if (index < this.menus.length) {
                    brick.showString(((this.menuPos == index) ? '=>' : '  ') + this.menus[index].name, i + 1)
                }
            }
        }

        setSubMenu(): void {
            const prevType = this.name;
            this.menus[this.menuPos].setSubMenu();
            menuTypes[menuTypeId].prevType = prevType;

            showMenu();
        }

        // ---

        button(): boolean {
            if (robi.run) {
                robi.stop();
                return false;
            }
            return true;
        }

        buttonEnter(): void {
            if (!this.button()) return;
            this.setSubMenu();
            this.menus[this.menuPos].run();
        }

        buttonUp(): void {
            if (!this.button()) return;
            this.menuPos--;
            this.show();
        }

        buttonLeft(): void {
            if (!this.button()) return;
            this.menuPos--;
            this.show();
        }

        buttonDown(): void {
            if (!this.button()) return;
            this.menuPos++;
            this.show();
        }

        buttonRight(): void {
            if (!this.button()) return;
            this.menuPos++;
            this.show();
        }
    }
    new MenuType('');

    class MenuDoneType extends MenuType {
        show(): void {
        }

        button(): boolean {
            brick.setStatusLight(StatusLight.Green)

            if (robi.run) {
                robi.stop();
                return false;
            }

            setMenu(this.prevType);
            showMenu();
            return false;
        }
    }
    new MenuDoneType('done');

    class MenuLoggerType extends MenuType {
        show(): void {
            if (this.menuPos < 0)
                this.menuPos = 0;

            if (this.menuPos > logger.length)
                this.menuPos = logger.length;

            // ---

            brick.clearScreen()

            brick.showString('Page: ' + this.menuPos, 1)

            const lines = 9;
            for (let i = 0; i < lines; i++) {
                let line = (this.menuPos * lines) + i;

                if (line < logger.length)
                    brick.showString(logger[line], i + 3)
            }
        }

        buttonEnter(): void {
            setMenu(this.prevType);
            showMenu();
        }
    }
    new MenuLoggerType('logger');

    // ---

    brick.buttonEnter.onEvent(ButtonEvent.Bumped, function () {
        menuTypes[menuTypeId].buttonEnter()
    })
    brick.buttonUp.onEvent(ButtonEvent.Bumped, function () {
        menuTypes[menuTypeId].buttonUp()
    })
    brick.buttonLeft.onEvent(ButtonEvent.Bumped, function () {
        menuTypes[menuTypeId].buttonLeft()
    })
    brick.buttonDown.onEvent(ButtonEvent.Bumped, function () {
        menuTypes[menuTypeId].buttonDown()
    })
    brick.buttonRight.onEvent(ButtonEvent.Bumped, function () {
        menuTypes[menuTypeId].buttonRight()
    })
}

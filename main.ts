let count = 1;
function PAUSE(): void {
    brick.clearScreen()
    brick.showString('PAUSE ' + (count++), 1)
    pause(3 * 1000)
}

function MotorA_reset(): void {
    motors.mediumA.setBrake(true);
    motors.mediumA.setPauseOnRun(false);

    motors.mediumA.reset();
}

function MotorA_stop(): void {
    motors.mediumA.setBrake(false);
    motors.mediumA.stop();
}

function MotorA(action: string, n?: number, s?: string): void {
    motors.mediumA.run(10, n, MoveUnit.Degrees);

    if (s != 'nowait') {
        motors.mediumA.pauseUntilReady();
    }
}

function MotorD_reset(): void {
    motors.mediumD.setBrake(true);
    motors.mediumD.setPauseOnRun(false);

    motors.mediumD.reset();
}

function MotorD_stop(): void {
    motors.mediumD.setBrake(false);
    motors.mediumD.stop();
}

function MotorD(action: string, n?: number, s?: string): void {
    motors.mediumD.run(10, n, MoveUnit.Degrees);

    if (s != 'nowait') {
        motors.mediumD.pauseUntilReady();
    }
}

function programJJ(): void {
    robi.actionClean();
    robi.actionOnExit(MotorA_stop);
    robi.actionCallback("reset", MotorA_reset);
    robi.actionCallback("hoch", MotorA, 180, 'nowait');
    robi.actionFollowGyro(-90, -48);
    robi.actionCallback("runter", MotorA, -180);
    robi.actionFollowGyro(-90, 48);
    robi.startProgram();
}

function programLKW(): void {
    robi.actionClean();

    Aufgaben(true, true, true, true);

    robi.startProgram();
}

function programBruecke(): void {
    robi.actionClean();

    Aufgaben(false, true, true, true);

    robi.startProgram();
}

function programHubschrauber(): void {
    robi.actionClean();

    Aufgaben(false, false, true, true);

    robi.startProgram();
}

function Aufgaben(LKW: boolean = false, Bruecke: boolean = false, Kran: boolean = false, Parken: boolean = false): void {
    robi.actionOnExit(MotorA_stop);
    robi.actionCallback("reset", MotorA_reset);
    robi.actionOnExit(MotorD_stop);
    robi.actionCallback("reset", MotorD_reset);

    let ohneBruecke = 15 + 23 + 10 - 17;

    if (LKW) {
        robi.actionFollowGyro(40, 43);
        robi.actionStop();
        robi.actionFollowGyro(40, 5); // LKW 1
        robi.actionCallback("hoch", MotorA, 90);
        robi.actionFollowGyro(40, 23);
        robi.actionRotate(-40);
        robi.actionFollowColor(4, robi.FollowLineType.right);
    } else {
        robi.actionCallback("hoch", MotorA, 90, 'nowait');
        robi.actionFollowGyro(45, 20);
        robi.actionFollowColor(94 - ohneBruecke + 1, robi.FollowLineType.right);
    }

    if (Bruecke) {
        robi.actionCallback("runter", MotorA, -90);
        robi.actionFollowColor(15, robi.FollowLineType.right); // LKW 2
        robi.actionCallback("hoch", MotorA, 90, 'nowait');

        // ---

        robi.actionFollowColor(23, robi.FollowLineType.right); // Brücke 1
        robi.actionCallback("hoch", MotorA, 90, 'nowait');
        robi.actionFollowGyro(0, 10);
        robi.actionCallback("hoch", MotorA, 180, 'nowait');
        robi.actionFollowGyro(0, -17); // Brücke 2
        robi.actionCallback("hoch", MotorA, 180);
    } else {
        robi.actionCallback("hoch", MotorA, 90, 'nowait');
        robi.actionFollowColor(ohneBruecke, robi.FollowLineType.right);
        robi.actionStop();
    }

    robi.actionCallback("stop", MotorA_stop);

    // ---

    robi.actionFollowColor(65, robi.FollowLineType.right);
    robi.actionFollowGyro(45, 10);
    robi.actionFollowGyro(45, -4);
    robi.actionRotate(-20);
    robi.actionFollowGyro(0, 8);
    // Hubschrauber

    if (Kran) {
        robi.actionFollowGyro(20, -8);
        robi.actionStop();
        robi.actionFollowGyro(20, -5);
        robi.actionCallback("runter", MotorD, 130);
        robi.actionCallback("stop", MotorD_stop);
        robi.actionFollowGyro(0, -5);
        robi.actionStop();
        robi.actionFollowGyro(0, -34);
        robi.actionStop();
        // Frachtkran

        robi.actionFollowGyro(0, 15);
        robi.actionCallback("hoch", MotorD, -130);
        robi.actionCallback("stop", MotorD_stop);
    } else {
        Parken = false;
    }

    if (Parken) {
        robi.actionFollowGyro(0, -20);
        robi.actionStop();
        robi.actionFollowGyro(-45, -10);
        robi.actionStop();
        robi.actionFollowGyro(-45, -14);
        robi.actionStop();
        robi.actionFollowGyro(0, -12);
        robi.actionStop();

        // langsam Fahren
        robi.actionFollowGyro(0, -10, 20);
        robi.actionStop();
        robi.actionFollowGyro(0, -10, 20);
        robi.actionStop();
        robi.actionFollowGyro(0, -10, 20);
        robi.actionStop();
        robi.actionCallback("hoch", MotorA, 180, 'nowait');
        robi.actionFollowGyro(0, -10, 20);
        robi.actionStop();
        robi.actionFollowGyro(0, -10, 20);
        robi.actionStop();
    }
}

// ---

let TESThardware_check_a: number;
let TESThardware_check_b: number;
function TESThardware_check(action: string, n?: number) {
    switch (action) {
        case 'pause':
            pause(3 * 1000);
            break;

        case 'motor1':
            TESThardware_check_a = hardware.motorConfig.readMotorPosition()[M1];
            break;
        case 'motor2':
            TESThardware_check_b = hardware.motorConfig.readMotorPosition()[M1];
            Test.assertTrue((Math.abs(n - (TESThardware_check_b - TESThardware_check_a)) < 3), 'motorCheck');
            break;

        case 'gyro1':
            TESThardware_check_a = hardware.readGyroAngle();
            break;
        case 'gyro2':
            TESThardware_check_b = hardware.readGyroAngle();
            Test.assertTrue((Math.abs(n - (TESThardware_check_b - TESThardware_check_a)) < 10), 'gyroCheck');
            break;
    }
}
function TESThardware(): void {
    robi.actionClean();

    DEBUG = true;

    robi.actionCallback('motor1', TESThardware_check);
    robi.actionMove(10);
    robi.actionCallback('motor2', TESThardware_check, 10);
    robi.actionCallback('pause', TESThardware_check);

    robi.actionCallback('motor1', TESThardware_check);
    robi.actionMove(-10);
    robi.actionCallback('motor2', TESThardware_check, -10);
    robi.actionCallback('pause', TESThardware_check);

    // ---

    robi.actionCallback('gyro1', TESThardware_check);
    robi.actionRotate(90);
    robi.actionCallback('gyro2', TESThardware_check, 90);
    robi.actionCallback('pause', TESThardware_check);

    robi.actionCallback('gyro1', TESThardware_check);
    robi.actionRotate(-90);
    robi.actionCallback('gyro2', TESThardware_check, -90);
    robi.actionCallback('pause', TESThardware_check);

    // ---

    robi.startProgram();
}

function TESTcolor(): void {
    robi.actionClean();

    DEBUG = false;

    robi.actionFollowColor(150, robi.FollowLineType.right);

    // ---

    robi.startProgram();
}

// ---

function startup() {
    brick.showBoot()

    hardware.setMotor(
        motors.largeBC,
        motors.largeB,
        motors.largeC,
        6.24,
        12,
        false,
        true,
        false,
        false
    )
    hardware.setGyroSensor(sensors.gyro2, false);
    hardware.setColorSensor(sensors.color3);

    motors.mediumA.setRegulated(true);

    motors.mediumA.setBrake(false);
    motors.mediumA.stop();

    const menuTests = 'menuTests';
    menu.newMenu('', 'gyroReset', hardware.gyroReset);
    menu.newMenu('', 'Jana und Judith', programJJ);
    menu.newMenu('', 'LKWs', programLKW);
    menu.newMenu('', 'Bruecke', programBruecke);
    menu.newMenu('', 'Hubschrauber', programHubschrauber);
    menu.newMenu('', 'TEST', null, menuTests);
    menu.newMenu('', 'releaseBreaks', hardware.releaseBreaks);
    menu.newMenu('', 'EXIT', brick.exitProgram);

    new menu.MenuType(menuTests);
    menu.newMenu(menuTests, 'ZURUECK', null, '');
    menu.newMenu(menuTests, 'LOGGER', null, 'logger');
    menu.newMenu(menuTests, 'TESTnormAngle', Helper.TESTnormAngle);
    menu.newMenu(menuTests, 'TESTspeed', Helper.TESTspeed);
    menu.newMenu(menuTests, 'TESThardware', TESThardware);
    menu.newMenu(menuTests, 'TESTcolor', TESTcolor);

    brick.clearScreen()
    menu.setMenu('');
    menu.showMenu();

    brick.setStatusLight(StatusLight.Green)
}

startup()

sensors.touch1.onEvent(ButtonEvent.Bumped, function () {
    robi.stop();
    pause(300);
    programJJ();
})

sensors.touch4.onEvent(ButtonEvent.Bumped, function () {
    robi.stop();
    pause(300);
    // programLKW();
    programBruecke();
    // programHubschrauber();
})

forever(function () {
    robi.updateGyro()
    robi.updateAction()
})
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
    robi.actionFollowGyro(-90, -45);
    robi.actionCallback("runter", MotorA, -180);
    robi.actionFollowGyro(-90, 45);
    robi.startProgram();
}

function programLKW(): void {
    robi.actionClean();

    Aufgaben(true, true, true);

    robi.startProgram();
}

function programHubschrauber(): void {
    robi.actionClean();

    Aufgaben(false, true, true);

    robi.startProgram();
}

function Aufgaben(LKW_Bruecke: boolean = false, Kran: boolean = false, Parken: boolean = false): void {
    robi.actionOnExit(MotorA_stop);
    robi.actionCallback("reset", MotorA_reset);
    robi.actionOnExit(MotorD_stop);
    robi.actionCallback("reset", MotorD_reset);

    if (LKW_Bruecke) {
        robi.actionFollowGyro(40, 48); // LKW 1
        robi.actionCallback("hoch", MotorA, 90);
        robi.actionFollowGyro(40, 25);
        robi.actionRotate(-40);
        // robi.actionFollowGyro(0, 4);
        robi.actionFollowColor(4, robi.FollowLineType.right);
        robi.actionCallback("runter", MotorA, -90);
        // robi.actionFollowGyro(0, 13); // LKW 2
        robi.actionFollowColor(13, robi.FollowLineType.right); // LKW 2
        robi.actionCallback("hoch", MotorA, 90);
        // robi.actionFollowGyro(0, 23); // Brücke 1
        robi.actionFollowColor(23, robi.FollowLineType.right); // Brücke 1
        robi.actionCallback("hoch", MotorA, 90, 'nowait');
        robi.actionFollowGyro(0, 10);
        robi.actionCallback("hoch", MotorA, 180, 'nowait');
        robi.actionFollowGyro(0, -13); // Brücke 2
        robi.actionCallback("hoch", MotorA, 180, 'nowait');
    } else {
        robi.actionCallback("hoch", MotorA, 180);
        robi.actionFollowGyro(45, 20);
        robi.actionFollowColor(92, robi.FollowLineType.right);
        robi.actionStop();
    }

    robi.actionCallback("stop", MotorA_stop);
    
    robi.actionFollowColor(65, robi.FollowLineType.right);
    robi.actionFollowGyro(45, 10);
    robi.actionFollowGyro(45, -3);
    robi.actionRotate(-20);
    robi.actionFollowGyro(0, 5);
    // Hubschrauber

    if (Kran) {
        robi.actionFollowGyro(20, -13);
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
        robi.actionFollowGyro(-45, -15);
        robi.actionStop();
        robi.actionFollowGyro(-45, -10);
        robi.actionStop();
        robi.actionFollowGyro(0, -15);
        robi.actionStop();
        robi.actionFollowGyro(0, 20);
        robi.actionStop();

        // langsam Fahren
        robi.actionFollowGyro(0, -5);
        robi.actionStop();
        robi.actionFollowGyro(0, -5);
        robi.actionStop();
        robi.actionFollowGyro(0, -5);
        robi.actionStop();
        robi.actionFollowGyro(0, -5);
        robi.actionStop();
        robi.actionFollowGyro(0, -5);
    }
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
    const menuTools = 'menuTools';
    menu.newMenu('', 'gyroReset', hardware.gyroReset);
    menu.newMenu('', 'Jana und Judith', programJJ);
    menu.newMenu('', 'LKWs', programLKW);
    menu.newMenu('', 'Hubschrauber', programHubschrauber);
    menu.newMenu('', 'releaseBreaks', hardware.releaseBreaks);
    menu.newMenu('', 'EXIT', brick.exitProgram);

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
    programLKW();
})

forever(function () {
    robi.updateGyro()
    robi.updateAction()
})

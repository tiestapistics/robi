function showBatteryLevel(): void {
    brick.clearScreen();
    
    const batteryLevel: number = brick.batteryLevel();
    brick.showString('Battery Level:', 2)
    brick.showString('' + batteryLevel, 3)

    const voltage = brick.batteryInfo(BatteryProperty.Voltage);
    brick.showString('Voltage:' + Math.roundDecimal(voltage) + ' V', 5)

    const current = brick.batteryInfo(BatteryProperty.Current);
    brick.showString('Current:' + Math.roundDecimal(current) + ' mA', 6)
}

function showSerialNumber(): void {
    brick.clearScreen();

    const firmwareVersion: string = control.deviceFirmwareVersion();
    brick.showString('Firmware Version:', 2)
    brick.showString('' + firmwareVersion, 3)

    const serialNumber: number = control.deviceSerialNumber();
    brick.showString('Device Serial Number:', 4)
    brick.showString('' + serialNumber, 5)

    /*
    const longSerialNumber: string = control.deviceLongSerialNumber().toString();
    brick.showString('Long Device Serial Number:', 6)
    brick.showString('' + longSerialNumber, 7)

    const dalVersion: string = control.deviceDalVersion();
    brick.showString('DAL Version:', 8)
    brick.showString('' + dalVersion, 9)
    */
}

function showGyro(): void {
    const s = 10;
    const update = 200;

    for (let index = 0; index < s * 1000 / update; index++) {
        brick.clearScreen();
        brick.showString('Gyro: ' + index, 2)
        brick.showString('' + hardware.readGyroAngle(), 3)
        pause(update);
    }
    brick.clearScreen();
}

function showColor(): void {
    const s = 10;
    const update = 200;

    for (let index = 0; index < s * 1000 / update; index++) {
        brick.clearScreen();
        brick.showString('' + index, 2)
        let RGB = hardware.readColor();
        brick.showString('Color R:' + RGB[0], 4);
        brick.showString('Color G:' + RGB[1], 5);
        brick.showString('Color B:' + RGB[2], 6);
        pause(update);
    }
    brick.clearScreen();
}

function showPorts(): void {
    robi.setLive(false);
    brick.showPorts()
}

function TEST1(): void {
    robi.actionMove(40)
}

function TEST2(): void {
    robi.actionMove(-40)
}

function TEST3(): void {
    robi.actionRotate(180, 0, -100)
}

function TEST4(): void {
    robi.actionRotate(-180)
}

// ---

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
        //motors.mediumA.pauseUntilStalled();
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
        //motors.mediumD.pauseUntilStalled();
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
        robi.actionFollowGyro(0, -15); // Brücke 2
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

function programDavid(): void {
    robi.actionClean();
    robi.actionOnExit(MotorA_stop);
    robi.actionCallback("reset", MotorA_reset);
    robi.actionCallback("hoch", MotorA, 180, 'nowait');

    robi.actionFollowGyro(0, 110);
    robi.actionStop();

    robi.actionCallback("runter", MotorA, -90, 'nowait');
    robi.actionFollowGyro(-70, 20);
    robi.actionStop();

    robi.actionCallback("runter", MotorA, -90, 'nowait');
    robi.actionFollowGyro(0, 20);
    robi.actionStop();

    robi.startProgram();
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

    robi.actionFollowColor(150, robi.FollowLineType.right);

    // ---

    robi.startProgram();}

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
    menu.newMenu('', 'David', programDavid);
    menu.newMenu('', 'TEST', null, menuTests);
    menu.newMenu('', 'TOOLS', null, menuTools);
    menu.newMenu('', 'releaseBreaks', hardware.releaseBreaks);
    menu.newMenu('', 'EXIT', brick.exitProgram);

    new menu.MenuType(menuTests);
    menu.newMenu(menuTests, 'ZURUECK', null, '');
    menu.newMenu(menuTests, 'LOGGER', null, 'logger');
    menu.newMenu(menuTests, 'TESTnormAngle', Helper.TESTnormAngle);
    menu.newMenu(menuTests, 'TESTspeed', Helper.TESTspeed);
    menu.newMenu(menuTests, 'TESThardware', TESThardware);
    menu.newMenu(menuTests, 'TESTcolor', TESTcolor);
    menu.newMenu(menuTests, 'showGyro', showGyro);
    menu.newMenu(menuTests, 'showColor', showColor);
    menu.newMenu(menuTests, 'show Ports', showPorts);
    menu.newMenu(menuTests, 'show Battery Level', showBatteryLevel);
    menu.newMenu(menuTests, 'show Serial Number', showSerialNumber);

    new menu.MenuType(menuTools);
    menu.newMenu(menuTools, 'ZURUECK', null, '');
    menu.newMenu(menuTools, 'LOGGER', null, 'logger');
    menu.newMenu(menuTools, 'TEST1', TEST1);
    menu.newMenu(menuTools, 'TEST2', TEST2);
    menu.newMenu(menuTools, 'TEST3', TEST3);
    menu.newMenu(menuTools, 'TEST4', TEST4);
    menu.newMenu(menuTools, 'startProgram', robi.startProgram);

    brick.clearScreen()
    menu.setMenu('');
    menu.showMenu();

    brick.setStatusLight(StatusLight.Green)
}

startup()

forever(function () {
    robi.updateGyro()
    robi.updateAction()
})

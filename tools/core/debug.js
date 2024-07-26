const viewMemory = (CPU, start, length) => {
    console.log("Memory View:");
    for (let i = 0; i < length; i += 16) {
        let line = `0x${(start + i).toString(16).padStart(4, '0')}: `;
        for (let j = 0; j < 16 && (i + j) < length; j++) {
            line += CPU.read(start + i + j).toString(16).padStart(2, '0') + ' ';
        }
        console.log(line);
    }
}

const debug = (CPU) => {
    let running = true;
    const commands = {
        's': () => {
            step(CPU);
            console.log(disassemble(CPU, CPU.registers[IP]));
            viewMemory(CPU, CPU.registers[SP], 32);
            console.log("Registers:", CPU.registers);
        },
        'r': () => {
            console.log("Registers:", CPU.registers);
        },
        'm': (args) => {
            const [start, length] = args.split(' ').map(x => parseInt(x, 16));
            viewMemory(CPU, start, length || 64);
        },
        'b': (args) => {
            // Set breakpoint (not implemented in this example)
            console.log("Breakpoints not implemented in this example.");
        },
        'c': () => {
            // Continue execution until breakpoint (not implemented in this example)
            console.log("Continue not implemented in this example.");
        },
        'q': () => {
            running = false;
        },
        'h': () => {
            console.log("Commands: s (step), r (registers), m <addr> <len> (memory), b <addr> (breakpoint), c (continue), q (quit), h (help)");
        }
    };

    console.log("Debugger started. Type 'h' for help.");
    while (running) {
        const input = prompt("> ");
        const [cmd, ...args] = input.split(' ');
        if (commands[cmd]) {
            commands[cmd](args.join(' '));
        } else {
            console.log("Unknown command. Type 'h' for help.");
        }
    }
}

const disassemble = (CPU, address) => {
    const opcodeFull = CPU.read(address);
    const opcode = opcodeFull & 0b111111;
    const src0Type = (opcodeFull >> 6) & 0b10;
    const src1Type = (opcodeFull >> 6) & 0b01;
    const insn = Instructions[opcode];

    if (!insn) {
        return `Unknown instruction: ${opcodeFull.toString(16)}`;
    }

    let operands = [];
    let nextAddress = address + 1;

    function readOperand(type) {
        if (type === SRC_TYPE_REG) {
            const reg = CPU.read(nextAddress++);
            return `r${reg.toString(16)}`;
        } else {
            const low = CPU.read(nextAddress++);
            const high = CPU.read(nextAddress++);
            return `0x${((high << 8) | low).toString(16)}`;
        }
    }

    switch(insn.operands) {
        case OperandPattern.NONE: break;
        case OperandPattern.R: 
            operands.push(readOperand(SRC_TYPE_REG));
            break;
        case OperandPattern.Src:
            operands.push(readOperand(src0Type));
            break;
        case OperandPattern.SrcR:
            operands.push(readOperand(src0Type));
            operands.push(readOperand(SRC_TYPE_REG));
            break;
        case OperandPattern.SrcSrc:
            operands.push(readOperand(src0Type));
            operands.push(readOperand(src1Type));
            break;
        case OperandPattern.SrcSrcR:
        case OperandPattern.SrcSrcRR:
            operands.push(readOperand(src0Type));
            operands.push(readOperand(src1Type));
            operands.push(readOperand(SRC_TYPE_REG));
            if (insn.operands === OperandPattern.SrcSrcRR) {
                operands.push(readOperand(SRC_TYPE_REG));
            }
            break;
    }

    return `${insn.name} ${operands.join(', ')}`;
}
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

export async function POST(request: Request) {
  try {
    const { x, y } = await request.json();

    let command;
    if (isWindows) {
      // Windows (using PowerShell)
      command = `powershell -command "$cursor = [System.Windows.Forms.Cursor]::Position; $cursor.X = ${x}; $cursor.Y = ${y}; [System.Windows.Forms.Cursor]::Position = $cursor"`;
    } else if (isMac) {
      // macOS (using cliclick)
      command = `cliclick m:${x},${y}`;
    } else {
      // Linux (using xdotool)
      command = `xdotool mousemove ${x} ${y}`;
    }

    console.log('Executing command:', command);

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Command error:', stderr);
      throw new Error(stderr);
    }

    console.log('Mouse moved successfully:', stdout);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving mouse:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
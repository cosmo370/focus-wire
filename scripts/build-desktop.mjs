import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'

if (!isWindows && !isLinux) {
  console.error('Desktop packaging is currently configured for Windows and Linux.')
  process.exit(1)
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: isWindows,
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('vite', ['build'], { ...process.env, ELECTRON_BUILD: '1' })

if (isWindows) {
  run('electron-builder', ['--win', 'nsis', '--x64'])
} else {
  run('electron-builder', ['--linux', 'AppImage', 'deb', '--x64'])
}

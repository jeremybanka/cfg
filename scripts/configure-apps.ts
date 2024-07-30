#!bun

import { existsSync, lstatSync, mkdirSync, readdirSync } from "node:fs"
import { rename, symlink, unlink } from "node:fs/promises"
import { homedir } from "node:os"
import { join, resolve } from "node:path"

const appConfigDir = join(import.meta.dirname, `..`, `apps`)

await configureBun()
await configureVSCodium()
await configureIllustrator()

async function configureBun() {
	const sourceDir = resolve(appConfigDir, `bun`)
	const targetDir = join(homedir(), `.bun`, `install`, `global`)
	for (const filename of [`package.json`, `bun.lockb`]) {
		const sourcePath = join(sourceDir, filename)
		const targetPath = join(targetDir, filename)
		console.log(`Configuring Bun`, { appConfigDir, sourcePath, targetPath })
		try {
			if (!existsSync(sourcePath)) {
				throw new Error(`Source file does not exist: ${sourcePath}`)
			}

			if (existsSync(targetPath)) {
				const isSymlink = lstatSync(targetPath).isSymbolicLink()
				if (isSymlink) {
					console.log(`Symlink already exists: ${targetPath}`)
					return
				} else {
					console.log(`Removing existing file: ${targetPath}`)
					await unlink(targetPath)
				}
			}

			await symlink(sourcePath, targetPath)
			console.log(`Symlink created: ${sourcePath} -> ${targetPath}`)
		} catch (thrown) {
			if (thrown instanceof Error) {
				console.error(thrown.message)
			} else {
				console.error(thrown)
			}
		}
	}
}

async function configureVSCodium() {
	const sourcePath = resolve(appConfigDir, `VSCodium`, `settings.json`)
	const targetPath = join(
		homedir(),
		`Library`,
		`Application Support`,
		`VSCodium`,
		`User`,
		`settings.json`
	)
	console.log(`Configuring VSCodium`, { appConfigDir, sourcePath, targetPath })
	try {
		if (!existsSync(sourcePath)) {
			throw new Error(`Source file does not exist: ${sourcePath}`)
		}

		if (existsSync(targetPath)) {
			const isSymlink = lstatSync(targetPath).isSymbolicLink()
			if (isSymlink) {
				console.log(`Symlink already exists: ${targetPath}`)
				return
			} else {
				console.log(`Removing existing file: ${targetPath}`)
				await unlink(targetPath)
			}
		}

		await symlink(sourcePath, targetPath)
		console.log(`Symlink created: ${sourcePath} -> ${targetPath}`)
	} catch (thrown) {
		if (thrown instanceof Error) {
			console.error(thrown.message)
		} else {
			console.error(thrown)
		}
	}
}

async function configureIllustrator() {
	const sourceWorkspacesDir = resolve(appConfigDir, `Illustrator`, `Workspaces`)
	const illustratorPrefsDir = join(homedir(), `Library`, `Preferences`)
	const versionPattern = /^Adobe Illustrator (\d+) Settings$/

	try {
		if (!existsSync(sourceWorkspacesDir)) {
			throw new Error(
				`Source workspaces directory does not exist: ${sourceWorkspacesDir}`
			)
		}

		const dirs = readdirSync(illustratorPrefsDir)
		const illustratorDirs = dirs.filter((dir) => versionPattern.test(dir))
		if (illustratorDirs.length === 0) {
			throw new Error(`No Adobe Illustrator settings directories found.`)
		}

		const highestVersionDir = illustratorDirs.sort((a, b) => {
			const aVersion = parseInt(a.match(versionPattern)![1], 10)
			const bVersion = parseInt(b.match(versionPattern)![1], 10)
			return bVersion - aVersion
		})[0]

		const targetWorkspacesDir = join(
			illustratorPrefsDir,
			highestVersionDir,
			`en_US`,
			`Workspaces`
		)
		console.log(`Configuring Illustrator`, {
			appConfigDir,
			sourceWorkspacesDir,
			targetWorkspacesDir,
		})

		if (!existsSync(targetWorkspacesDir)) {
			mkdirSync(targetWorkspacesDir, { recursive: true })
		}

		const sourceWorkspaces = readdirSync(sourceWorkspacesDir)
		for (const workspace of sourceWorkspaces) {
			const sourceWorkspacePath = join(sourceWorkspacesDir, workspace)
			const targetWorkspacePath = join(targetWorkspacesDir, workspace)

			if (existsSync(targetWorkspacePath)) {
				const isSymlink = lstatSync(targetWorkspacePath).isSymbolicLink()
				if (!isSymlink) {
					console.log(`Removing existing file: ${targetWorkspacePath}`)
					await unlink(targetWorkspacePath)
				}
			}

			await symlink(sourceWorkspacePath, targetWorkspacePath)
			console.log(
				`Symlink created: ${sourceWorkspacePath} -> ${targetWorkspacePath}`
			)
		}

		const targetWorkspaces = readdirSync(targetWorkspacesDir)
		for (const workspace of targetWorkspaces) {
			const sourceWorkspacePath = join(sourceWorkspacesDir, workspace)
			const targetWorkspacePath = join(targetWorkspacesDir, workspace)

			if (!existsSync(sourceWorkspacePath)) {
				const newSourceWorkspacePath = join(sourceWorkspacesDir, workspace)
				console.log(
					`Moving existing workspace to source: ${targetWorkspacePath} -> ${newSourceWorkspacePath}`
				)
				await rename(targetWorkspacePath, newSourceWorkspacePath)
				await symlink(newSourceWorkspacePath, targetWorkspacePath)
				console.log(
					`Symlink created: ${newSourceWorkspacePath} -> ${targetWorkspacePath}`
				)
			}
		}
	} catch (thrown) {
		if (thrown instanceof Error) {
			console.error(thrown.message)
		} else {
			console.error(thrown)
		}
	}
}

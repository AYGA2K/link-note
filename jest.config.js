const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
	setupFiles: ["dotenv/config"],
	setupFilesAfterEnv: ["./jest.setup.js"],
	testEnvironment: "node",
	testMatch: ["<rootDir>/tests/*.ts"],
	transform: {
		...tsJestTransformCfg,
	},
};

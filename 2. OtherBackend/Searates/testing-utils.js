const readline = require('readline');
const express = require('express');
const { eorderDelivered } = require('./mailer/eorder/eorder_mailer');
const { runCheck } = require('./automation/Modul/Searates_API');

const helpers = runCheck();

if (require.main === module) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.setPrompt('> ');
    rl.prompt();


    const commands = {
        "/exit": {
            description: "Exit the program",
            action: () => {
                console.log("👋 Exiting...");
                process.exit(0);
            }
        },
        "testmail": {
            description: "Send a test mail",
            action: () => eorderDelivered(250049300004)
        },
        "manual": {
            description: "Run BL and CT tracking manually",
            action: async () => {
                console.log("🔍 Tracking BL numbers first...");
                const blNumbers = await helpers.findBLNumber();
                console.log("✅ Found BL Numbers:", blNumbers);
                console.log("Total BL Count : ", blNumbers.length);

                if (blNumbers.length > 0) {
                    console.log("🚀 Starting BL tracking...");
                    await helpers.trackMultipleBLs();
                } else {
                    console.log("⚠️ No BL numbers found. Skipping BL tracking.");
                }

                console.log("🔍 Tracking CT numbers...");
                const ctNumbers = await helpers.findCTNumber();
                console.log("Total CT Count : ", ctNumbers.length);

                // if (ctNumbers.length > 0) {
                //     console.log("🚀 Starting CT tracking...");
                //     await helpers.trackMultipleCTs();
                // } else {
                //     console.log("⚠️ No CT numbers found. Skipping CT tracking.");
                // }

                console.log("✅ Completed tracking cycle.");
            }
        },
        "manualtrack": {
            description: "Run manual track",
            action: () => helpers.manualtrack()
        },
        "/fetch": {
            description: "Trigger manual SeaRates tracking (limit 2)",
            action: async () => {
                if (helpers && helpers.manualTrackLimited) {
                    await helpers.manualTrackLimited();
                } else {
                    console.log("❌ manualTrackLimited not found in helpers");
                }
            }
        },
        "datetrack": {
            description: "Track by date range",
            action: () => {
                rl.question("Please type start date (YYYY-MM-DD): ", (startDate) => {
                    rl.question("Please type end date (YYYY-MM-DD): ", (endDate) => {
                        helpers.datetrack(startDate, endDate);
                        rl.prompt();
                    });
                });
            }
        },
        "querytrack": {
            description: "Track by custom query",
            action: () => {
                rl.question("Please type NUMBER: ", (number) => {
                    rl.question("Please type SOID: ", (soid) => {
                        rl.question("please type sealine :", (sealine) => {

                            helpers.querytrack(number, soid, sealine);
                            rl.prompt();
                        })

                    });
                });
            }
        },
        "help": {
            description: "Show all commands",
            action: () => {
                console.log("📖 Available commands:");
                for (const [cmd, { description }] of Object.entries(commands)) {
                    console.log(`  ${cmd.padEnd(12)} - ${description}`);
                }
            }
        },
        "/help": {
            description: "Show all commands",
            action: () => {
                console.log("📖 Available commands:");
                for (const [cmd, { description }] of Object.entries(commands)) {
                    console.log(`  ${cmd.padEnd(12)} - ${description}`);
                }
            }
        },
        "-h": {
            description: "Show all commands",
            action: () => {
                console.log("📖 Available commands:");
                for (const [cmd, { description }] of Object.entries(commands)) {
                    console.log(`  ${cmd.padEnd(12)} - ${description}`);
                }
            }
        }
    };


    rl.on('line', async (input) => {
        const cmd = input.trim();
        // console.clear(); // Removing clear to avoid losing logs

        const command = commands[cmd];
        if (command) {
            await command.action();
        } else {
            console.log(`❌ Unknown command: ${cmd}`);
        }

        rl.prompt();
    });
}

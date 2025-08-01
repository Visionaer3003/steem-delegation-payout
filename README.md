# Steem Delegation Payout Bot

This Node.js script distributes daily STEEM payouts proportionally based on incoming delegations. Originally developed for the account **@suntr**, but can be adapted to any account.

## Features

- Calculates daily payouts based on delegation amount
- Excludes specific accounts via file
- Sends STEEM transfers via active key
- Logs all actions to `logs/` folder
- Supports `.env` configuration

## Requirements

- Node.js (v14 or later)
- STEEM active key of the payout account

## Installation

```bash
git clone https://github.com/Visionaer3003/steem-delegation-payout.git
cd steem-delegation-payout
npm install
```

## Configuration

1. Create a `.env` file based on `example.env`:

```env
STEEM_KEY=5Jxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

2. Add Steem usernames to `ausgeschlossen.txt` (one per line) to exclude them from payouts.

## Usage

Dry Run Mode
In the suntr_payout.js file, there's a constant:

const DRY_RUN = false // set to false to enable real payouts

If set to true, the script will simulate payouts and print the results to the console/log file without sending any STEEM.

If set to false, actual STEEM transfers will be broadcast to the blockchain.

⚠️ Make sure you understand this setting before running the bot with real payouts.


### Run the main payout script

```bash
node suntr_payout.js
```

This will:

- Fetch all delegators to the account
- Calculate payout per 1,000 delegated SP (e.g., 0.38 STEEM/day)
- Skip excluded accounts
- Execute STEEM transfers
- Write logs to `logs/log_YYYY-MM-DD.txt`

### Clean old logs

```bash
node log_cleaner.js
```

Removes outdated or temporary log data if necessary.

## Example

If:

- `@user1` delegated 2,000 SP  
- `@user2` delegated 1,000 SP  
- Daily total payout is set to **1.14 STEEM**

Then:

- `@user1` receives → 0.76 STEEM  
- `@user2` receives → 0.38 STEEM


⏰ Automating with crontab
To run the payout script automatically once per day, add the following line to your crontab:

crontab -e
Then add:

0 8 * * * /usr/bin/node /path/to/your/project/suntr_payout.js >> /path/to/your/project/logs/cron.log 2>&1
Explanation:

Runs every day at 08:00 AM server time

Uses Node.js to execute suntr_payout.js

Appends output to a daily cron log file

✅ Replace /path/to/your/project/ with the actual path to your project directory.


## License

This project is licensed under the [MIT License](LICENSE).

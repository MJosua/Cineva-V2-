module.exports = {
    apps: [{
        name: 'searates-child-api',
        script: 'index.js',
        exec_mode: 'fork',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production'
        },
        // Logging
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        merge_logs: true,
        // Restart strategy
        exp_backoff_restart_delay: 100,
        max_restarts: 10,
        min_uptime: '10s'
    }]
};

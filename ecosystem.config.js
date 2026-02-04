module.exports = {
    apps: [{
        name: 'integrated-api',
        script: 'index.js',
        exec_mode: 'fork',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '3G',
        env: {
            NODE_ENV: 'production'
        },
        // Performance optimizations
        node_args: '--max-old-space-size=4096',
        kill_timeout: 5000,
        wait_ready: false,
        listen_timeout: 3000,
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

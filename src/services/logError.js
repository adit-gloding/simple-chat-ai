/**
 * Log the error to the file
 */
import fs from 'fs';
import path from 'path';

const ERROR_LOG_DIR = 'errors';
const DAYS_TO_KEEP = 5;

/**
 * Log the error to the file
 */
export function logError(error, controllerName, functionName) {
    try {
        // Create errors directory if it doesn't exist
        const errorDir = path.join(process.cwd(), ERROR_LOG_DIR);
        if (!fs.existsSync(errorDir)) {
            fs.mkdirSync(errorDir);
        }

        // Get current date for filename
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const fileName = `${year}-${month}-${day}.txt`;
        const filePath = path.join(errorDir, fileName);

        // Format the timestamp for the log entry
        const timestamp = now.toISOString().replace('T', ' ').replace('Z', '');

        // Create the error message
        const errorMessage = `[${timestamp}] ${controllerName}.${functionName}\n${error.stack || error}\n\n`;

        // Append to file
        fs.appendFileSync(filePath, errorMessage);
    } catch (loggingError) {
        console.error('Error while logging error:', loggingError);
    }
}

/**
 * Cleanup the error logs
 */
export const cleanupErrorLogs = async () => {
    try {
        // Ensure the errors directory exists
        if (!fs.existsSync(ERROR_LOG_DIR)) {
            console.log('No errors directory found. Nothing to cleanup.');
            return;
        }

        const today = new Date();
        const files = fs.readdirSync(ERROR_LOG_DIR);

        files.forEach(file => {
            // Only process .txt files
            if (!file.endsWith('.txt')) return;

            // Extract date from filename (YYYY-MM-DD.txt)
            const dateStr = file.replace('.txt', '');
            // Ensure dateStr is in YYYY-MM-DD format
            const [year, month, day] = dateStr.split('-');
            if (!year || !month || !day) return;
            const fileDate = new Date(`${year}-${month}-${day}`);

            // Calculate days difference
            const diffTime = today.getTime() - fileDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Check if file is older than DAYS_TO_KEEP days
            if (diffDays > DAYS_TO_KEEP) {
                const filePath = path.join(ERROR_LOG_DIR, file);
                fs.unlinkSync(filePath);
                console.log(`Deleted old error log file: ${file}`);
            }
        });

        console.log('Error log cleanup completed successfully');
    } catch (error) {
        console.error('Error during log file cleanup:', error);
    }
};


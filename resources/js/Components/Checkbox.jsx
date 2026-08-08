export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 shadow-sm focus:ring-red-500 dark:focus:ring-offset-slate-900 ' +
                className
            }
        />
    );
}
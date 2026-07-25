export default function InputField({
    label,
    type,
    name,
    placeholder,
    value,
    onChange,
}) {
    return (

        <div className="mb-5">

            <label className="block mb-2 font-medium text-gray-700">

                {label}

            </label>

            <input

                type={type}

                name={name}

                value={value}

                placeholder={placeholder}

                onChange={onChange}

                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"

            />

        </div>

    );
}
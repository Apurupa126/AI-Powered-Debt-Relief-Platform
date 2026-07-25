import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function IncomeExpenseChart() {

    const data = {

        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun"
        ],

        datasets: [

            {

                label: "Income",

                data: [40000,42000,39000,45000,47000,50000],

                borderColor: "#2563eb",

                backgroundColor: "#2563eb"

            },

            {

                label: "Expenses",

                data: [25000,26000,24000,27000,30000,31000],

                borderColor: "#ef4444",

                backgroundColor: "#ef4444"

            }

        ]

    };

    return (

        <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-xl font-bold mb-5">

                Income vs Expenses

            </h2>

            <Line data={data} />

        </div>

    );

}
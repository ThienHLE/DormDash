import { Children } from "react";


export default function DeliveryCard(){
    return(
        <div className="flex flex-col gap-3 rounder-card border border-border bg-surface p-6 ">
            <h2 className="text-lg font-semibold text-ink">{delivery.item}</h2>
            <div className="text-sm text-body">
                <p><span className="font-medium">Pickup</span>{delivery.pickupLocation}</p>
                <p><span className="font-medium">Drop-off</span>{delivery.deliverylocation}</p>
            </div>
        </div>

    )


}
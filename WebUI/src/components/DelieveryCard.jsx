

export default function DelieveryCard(delivery, children ){
    return(
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6 ">
            <h2 className="text-lg font-semibold text-ink">{delivery.item}</h2>
            <div className="text-sm text-body">
                <p><span className="font-medium">Pickup</span>{delivery.pickuplocation}</p>
                <p><span className="font-medium">Drop-off</span>{delivery.deliverylocation}</p>
            </div>
            {children}
        </div>

    )
}
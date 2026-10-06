import { useState, useEffect } from "react";
import { Button, Modal } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { getRequests, acceptRequest, getMyRequests, getCurrentUser } from "../api/API.js";
import DeliveryCard from "../components/DelieveryCard.jsx";

function MyOrders(){

    const STATUS = {

        open:   {label: "Waiting for courier ", className: "bg-border text-body"},
        accepted:   {label: "Courier assigned ", className: "bg-primary-light text-primary"},
        picked_up:  {label: "Waiting for courier ", className: "bg-warning/10 text-warning"},
        delievered: {label: "Waiting for courier ", className: "bg-success/10 text-sucesss"},

    };


    function StatusBridge({status}){
        const s = STATUS[status] ?? {label: status, className: "bg-border text-body"}
        return <span className={'w-fit rounded-full px-3 py-1 text-sx font-medium  $ {s.className}'}>{s.label}</span>
    }


    return(
    <div className="grid gap-4 md:grid cols-2 lg:grid cols-3">

        <DeliveryCard key = {order._id} delievery={order} >
            <StatusBridge status ={order.status} />
            {["accepted", "picked_up"].includes(order.status) && (
                <Button variant="primary" onPress={() => navigate(`/deliveries/${order._id}/code`)}>
                    Show code
                </Button>
            )}
        </DeliveryCard>

    </div> 
    )






}

export default MyOrders; 
odoo.define("pos_longpolling.SyncNotification", function (require) {
    "use strict";

    const {useState} = owl.hooks;
    const Registries = require("point_of_sale.Registries");
    const SyncNotification = require("point_of_sale.SyncNotification");

    const MySyncNotification = (SyncNotification) =>
        class extends SyncNotification {
            constructor() {
                super(...arguments);

                this.longpolling = useState({
                    status: "green",
                    isLoading: false,
                });
            }

            get bus() {
                return this.env.services[this.props.service || "bus_service"]
                    .pos_longpolling.bus;
            }

            mounted() {
                super.mounted(...arguments);

                const bus = this.bus;
                this.updatePollStatus();
                bus.longpolling_connection.on(
                    "change:poll_connection change:poll_response",
                    () => {
                        this.updatePollStatus();
                    }
                );
            }

            updatePollStatus() {
                const bus = this.bus;
                if (bus.bus._isActive) {
                    if (bus.longpolling_connection.is_online) {
                        if (bus.longpolling_connection.waiting_poll_response) {
                            this.longpolling.status = "orange";
                        } else {
                            this.longpolling.status = "green";
                        }
                    } else {
                        this.longpolling.status = "red";
                    }
                } else {
                    this.longpolling.status = "hidden";
                }
            }

            onPollClick() {
                const bus = this.bus;
                this.longpolling.isLoading = true;
                bus.longpolling_connection.send_ping({serv: bus.route}).finally(() => {
                    this.longpolling.isLoading = false;
                });
            }
        };

    Registries.Component.extend(SyncNotification, MySyncNotification);

    return MySyncNotification;
});

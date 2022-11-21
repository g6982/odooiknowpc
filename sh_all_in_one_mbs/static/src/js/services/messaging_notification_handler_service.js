/** @odoo-module **/

import { registry } from "@web/core/registry";


var mbs_array_notification_type_danger = [
    'sh_sale_barcode_mobile_notification_danger',
    'sh_purchase_barcode_mobile_notification_danger',
    'sh_invoice_barcode_mobile_notification_danger',
    'sh_bom_barcode_mobile_notification_danger',
    'sh_product_barcode_mobile_notification_danger',
    'sh_inventory_barcode_mobile_notification_danger',
    'sh_inventory_adjustment_barcode_mobile_notification_danger'
];
var mbs_array_notification_type_info = [
    'sh_sale_barcode_mobile_notification_info',
    'sh_purchase_barcode_mobile_notification_info',
    'sh_invoice_barcode_mobile_notification_info',
    'sh_bom_barcode_mobile_notification_info',
    'sh_product_barcode_mobile_notification_info',
    'sh_inventory_barcode_mobile_notification_info',
    'sh_inventory_adjustment_barcode_mobile_notification_info'
];
export const asset_mobile_barcode_service = {
    dependencies: ["bus_service", "notification"],

    start(env, { bus_service, notification }) {

        bus_service.addEventListener('notification', ({ detail: notifications }) => {
            for (const { payload, type } of notifications) {
                if (mbs_array_notification_type_danger.includes(type)) {
                    if (payload.message) {
                        var str_msg = payload.message.match("SH_BARCODE_MOBILE_FAIL_");
                        if (str_msg) {
                            //remove SH_BARCODE_MOBILE_SUCCESS_ from message and make valid message
                            payload.message = payload.message.replace("SH_BARCODE_MOBILE_FAIL_", "");

                            //play sound
                            var src = "/sh_all_in_one_mbs/static/src/sounds/error.wav";
                            $("body").append('<audio src="' + src + '" autoplay="true"></audio>');
                        }
                    }

                    owl.Component.env.services.notification.notify({
                        title: payload.title,
                        message: payload.message,
                        type: 'danger',
                    });


                }
                if (mbs_array_notification_type_info.includes(type)) {
                    if (payload.message) {
                        var str_msg = payload.message.match("SH_BARCODE_MOBILE_SUCCESS_");
                        if (str_msg) {
                            //remove SH_BARCODE_MOBILE_SUCCESS_ from message and make valid message
                            payload.message = payload.message.replace("SH_BARCODE_MOBILE_SUCCESS_", "");

                            //play sound
                            var src = "/sh_all_in_one_mbs/static/src/sounds/picked.wav";
                            $("body").append('<audio src="' + src + '" autoplay="true"></audio>');
                        }
                    }
                    owl.Component.env.services.notification.notify({
                        title: payload.title,
                        message: payload.message,
                        type: 'info',
                    });

                }
            }
        });
    },
};
registry.category("services").add("sh_all_in_one_mbs_asset_mobile_barcode_service", asset_mobile_barcode_service);
/** @odoo-module **/


import { patch } from 'web.utils';

import { ListRenderer } from "@web/views/list/list_renderer";

const components = { ListRenderer };
import session from 'web.session';

var core = require('web.core');
var QWeb = core.qweb;

const { useExternalListener, useRef, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
var Dialog = require('web.Dialog');



import { _t } from "web.core";

let selectedDeviceId;
const codeReader = new ZXing.BrowserMultiFormatReader();




patch(components.ListRenderer.prototype, 'sh_all_in_one_mbs/static/src/js/sh_inventory_adjustment_barcode_mobile.js', {

    setup() {
        this.sh_inventory_adjustment_barcode_scanner_js_class = this.env.config.viewSubType;
        if (this.env.config.viewSubType != 'inventory_report_list') {
            return this._super();
        }
        onWillStart(async () => {
            await this._sh_barcode_scanner_load_widget_data()
            await this.shUpdateCameraControl()
        });
        this.state = useState({ value: 1 });

        this._super();


    },






    async _sh_barcode_scanner_load_widget_data() {
        const result = await session.rpc('/sh_all_in_one_mbs/sh_barcode_scanner_get_widget_data', {});
        this.sh_barcode_scanner_user_is_stock_manager = result.user_is_stock_manager;
        this.sh_barcode_scanner_user_has_stock_multi_locations = result.user_has_stock_multi_locations;
        this.sh_barcode_scanner_locations = result.locations;
        this.sh_inven_adjt_barcode_scanner_auto_close_popup = result.sh_inven_adjt_barcode_scanner_auto_close_popup;
        this.sh_inven_adjt_barcode_scanner_warn_sound = result.sh_inven_adjt_barcode_scanner_warn_sound;
        this.sh_barcode_scanner_location_selected = localStorage.getItem('sh_barcode_scanner_location_selected') || '';
        this.sh_scan_negative_stock = localStorage.getItem('sh_barcode_scanner_is_scan_negative_stock') || '';
    },


    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------



    /**
     * This method is called when barcode is changed above tree view
     * list view.
     *
     * @param {MouseEvent} ev
     */
    _on_change_sh_barcode_scanner_stock_quant_tree_input_barcode: async function (ev) {
        var self = this;
        var barcode = $(ev.currentTarget).val();
        var location_id = false;
        var scan_negativstore_stock = false;
        var location_name = '';
        var scan_negative_stock = $(ev.currentTarget).closest('.js_cls_sh_barcode_scanner_scanning_wrapper').find('.scan_negative_stock_cls').prop('checked');
        var $location_select = $(ev.currentTarget).closest('.js_cls_sh_barcode_scanner_scanning_wrapper').find('.js_cls_sh_barcode_scanner_location_select');
        if ($location_select.length) {
            location_id = $location_select.val();
            location_name = $location_select.find("option:selected").text();
        }
        if (location_id) {
            location_id = parseInt(location_id);
        }

        const result = await session.rpc('/sh_all_in_one_mbs/sh_barcode_scanner_search_stock_quant_by_barcode', {
            'barcode': barcode,
            'location_id': location_id,
            'location_name': location_name,
            'scan_negative_stock': scan_negative_stock,
        });



        if (result.result) {
            var message = _t(result.message);
            //$(document).find(".o_searchview_input").focus()
            //const kevt = new window.KeyboardEvent('keydown', { key: "Enter" });
            // document.querySelector('.o_searchview_input').dispatchEvent(kevt);
            var msg = $('<div class="alert alert-info mt-3" role="alert">' + message + ' </div>')
            $(document).find('.js_cls_alert_msg').html(msg);
            var th_write_date = $(document).find('th[data-name="write_date"]');
            th_write_date.click();
            th_write_date.click();
            //th_write_date.dispatchEvent(kevt);
            //th_write_date.dispatchEvent(kevt);


        } else {
            var message = _t(result.message);
            var msg = $('<div class="alert alert-danger mt-3" role="alert">' + message + ' </div>')
            $(document).find('.js_cls_alert_msg').html(msg);
            // Play Warning Sound
            if (self.sh_inven_adjt_barcode_scanner_warn_sound) {
                var src = "/sh_all_in_one_mbs/static/src/sounds/error.wav";
                $("body").append('<audio src="' + src + '" autoplay="true"></audio>');
            }

        }
        $(document).find('.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').val('');
        // ---------------------------------------
        // auto focus barcode input            
        $(document).find('.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').focus();
        $(document).find('.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').focus().keydown();
        $(document).find(".js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode").focus()
        $(document).find('.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').trigger({ type: 'keydown', which: 13 });

    },




    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * This method is called when barcode is changed above the tree view
     * list view.
     *
     * @param {MouseEvent} ev
     */
    _on_click_js_cls_sh_barcode_scanner_stock_quant_tree_btn_apply: async function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var self = this;
        const result = await session.rpc('/sh_all_in_one_mbs/sh_barcode_scanner_stock_quant_tree_btn_apply', {});
        var error = false;
        var title = _t("Something went wrong");
        if (result.result) {
            title = _t("Inventory Succeed");
            // self.trigger_up('reload');
            // $(document).find(".o_searchview_input").focus();
            // const kevt = new window.KeyboardEvent('keydown', { key: "Enter" });
            // document.querySelector('.o_searchview_input').dispatchEvent(kevt);
            var th_write_date = $(document).find('th[data-name="write_date"]');
            th_write_date.click();
            th_write_date.click();

        } else {
            title = _t("Something went wrong");
            error = true;
        }
        var message = _t(result.message);
        var dialog = new Dialog(this, {
            title: title,
            $content: $('<p>' + message + '</p>')
        });
        dialog.open();

        // auto close dialog.
        if (error && self.sh_inven_adjt_barcode_scanner_auto_close_popup > 0) {
            setTimeout(function () {
                if (dialog) {
                    dialog.close();
                }
            }, self.sh_inven_adjt_barcode_scanner_auto_close_popup);
        }
        // Play Warning Sound
        if (error && self.sh_inven_adjt_barcode_scanner_warn_sound) {
            var src = "/sh_all_in_one_mbs/static/src/sounds/error.wav";
            $("body").append('<audio src="' + src + '" autoplay="true"></audio>');
        }


    },


    /**
     * This method is called when location is changed above tree view
     * list view.
     *
     * @param {MouseEvent} ev
     */
    _on_change_sh_barcode_scanner_location_select: async function (ev) {
        ev.stopPropagation();
        var location = $(ev.currentTarget).val();
        localStorage.setItem('sh_barcode_scanner_location_selected', location);
    },

    on_change_scan_negative_stock_cls: async function (ev) {
        ev.stopPropagation();
        var self = this;
        var scan_negative_stock = $(ev.currentTarget).prop('checked');
        if (scan_negative_stock) {
            scan_negative_stock = 'true';
        } else {
            scan_negative_stock = 'false';
        }
        self.sh_scan_negative_stock = scan_negative_stock;
        localStorage.setItem('sh_barcode_scanner_is_scan_negative_stock', scan_negative_stock);

    },



    /**
     * ****************************************
     * decodeContinuously
     * ****************************************
     */
    decodeContinuously: function (codeReader, selectedDeviceId) {
        var self = this;
        codeReader.decodeFromInputVideoDeviceContinuously(selectedDeviceId, "js_id_sh_inventory_adjt_barcode_mobile_video", (result, err) => {
            if (result) {
                // properly decoded qr code
                console.log("Found QR code!", result);
                // $('input.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').val(result.text);
                // $('input.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').change();
                // self.trigger_up('reload');

                var el = document.querySelector(".js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode");
                el.value = result.text;
                el.dispatchEvent(new InputEvent("input", { bubbles: true }));
                el.dispatchEvent(new InputEvent("enter", { bubbles: true }));
                el.dispatchEvent(new InputEvent("change", { bubbles: true }));



                //RESULT
                document.getElementById("js_id_sh_inventory_adjt_barcode_mobile_result").textContent = result.text;
            }

            if (err) {
                // As long as this error belongs into one of the following categories
                // the code reader is going to continue as excepted. Any other error
                // will stop the decoding loop.
                //
                // Excepted Exceptions:
                //
                //  - NotFoundException
                //  - ChecksumException
                //  - FormatException

                if (err instanceof ZXing.NotFoundException) {
                    console.log("No QR code found.");
                    //EMPTY INPUT
                    // $('input[name="sh_inventory_adjt_barcode_mobile"]').val("");
                    // $('input[name="sh_inventory_adjt_barcode_mobile"]').change();
                }

                if (err instanceof ZXing.ChecksumException) {
                    console.log("A code was found, but it's read value was not valid.");
                }

                if (err instanceof ZXing.FormatException) {
                    console.log("A code was found, but it was in a invalid format.");
                }
            }
        });



    },


    /**
     * ****************************************
     * decodeOnce
     * ****************************************
     */
    decodeOnce: function (codeReader, selectedDeviceId) {
        codeReader
            .decodeFromInputVideoDevice(selectedDeviceId, "js_id_sh_inventory_adjt_barcode_mobile_video")
            .then((result) => {
                // $('input.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').val(result.text);
                // $('input.js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode').change();

                var el = document.querySelector(".js_cls_sh_barcode_scanner_stock_quant_tree_input_barcode");
                el.value = result.text;
                el.dispatchEvent(new InputEvent("input", { bubbles: true }));
                el.dispatchEvent(new InputEvent("enter", { bubbles: true }));
                el.dispatchEvent(new InputEvent("change", { bubbles: true }));



                //RESET READER
                codeReader.reset();

                //HIDE VIDEO
                $("#js_id_sh_inventory_adjt_barcode_mobile_vid_div").hide();

                //HIDE STOP BUTTON
                $("#js_id_sh_inventory_adjt_barcode_mobile_reset_btn").hide();

                //RESULT
                document.getElementById("js_id_sh_inventory_adjt_barcode_mobile_result").textContent = result.text;


            })
            .catch((err) => {
                console.error(err);
            });
    },



    /**
     * ****************************************
     * Start Camera Button
     * ****************************************
     */

    _on_click_sh_inventory_adjt_barcode_mobile_start_btn: function (ev) {
        var self = this;
        //SHOW VIDEO
        $("#js_id_sh_inventory_adjt_barcode_mobile_vid_div").show();

        //SHOW STOP BUTTON
        $("#js_id_sh_inventory_adjt_barcode_mobile_reset_btn").show();

        // this.decodeOnce(codeReader, selectedDeviceId);

        //CALL METHOD
        //CONTINUOUS SCAN OR NOT.
        if (self.sh_inventory_adjt_bm_is_cont_scan) {
            this.decodeContinuously(codeReader, selectedDeviceId);
        } else {
            this.decodeOnce(codeReader, selectedDeviceId);
        }



    },

    /**
     * ****************************************
     * Reset Camera Button
     * ****************************************
     */

    _on_click_sh_inventory_adjt_barcode_mobile_reset_btn: function (ev) {
        var self = this;
        //RESET READER
        codeReader.reset();

        //HIDE VIDEO
        $("#js_id_sh_inventory_adjt_barcode_mobile_vid_div").hide();

        //HIDE STOP BUTTON
        $("#js_id_sh_inventory_adjt_barcode_mobile_reset_btn").hide();

    },




    /**
     * Add list of cameras as a options in selection.
     * 
     */
    shUpdateCameraControl: async function () {
        var self = this;
        var list_cam = []
        await codeReader
            .getVideoInputDevices()
            .then(function (result) {
                _.each(result, function (item) {
                    list_cam.push({
                        'label': item.label,
                        'device_id': item.deviceId,
                    });
                    // var optionText = item.label;
                    // var optionValue = item.deviceId;
                    // $camSelect.append(new Option(optionText, optionValue));
                });
                self.list_cam = list_cam;

                // var $camSelect = $(QWeb.render('sh_all_in_one_mbs.stock_adjustment.tree.cam_select', { 'widget': self }));
                // if ($camSelect.length > 0) {
                // }
                // self.$camSelect = $camSelect;


            });


    },



    /**
     * ****************************************
     * Change Camera Selection
     * ****************************************
     */
    _on_change_sh_inventory_adjt_barcode_mobile_cam_select: function (ev) {
        selectedDeviceId = $(ev.currentTarget).val();
        self.selected_device_id = $(ev.currentTarget).val();
        $("#js_id_sh_inventory_adjt_barcode_mobile_reset_btn").click();
        $("#js_id_sh_inventory_adjt_barcode_mobile_start_btn").click();

    },



});




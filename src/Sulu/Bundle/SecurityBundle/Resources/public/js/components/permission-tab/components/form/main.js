/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

define(['config', 'sulusecurity/collections/roles'], function(Config, Roles) {

    'use strict';

    var permissionUrl = '/admin/api/permissions',
        permissions = Config.get('sulusecurity.permissions'),
        permissionTitles = Config.get('sulusecurity.permission_titles'),
        matrixContainerSelector = '#matrix-container',
        matrixSelector = '#matrix',
        permissionData = {
            id: null,
            type: null,
            permissions: {}
        },

        bindCustomEvents = function() {
            this.sandbox.on('husky.matrix.changed', changePermission.bind(this));
            this.sandbox.on('sulu.header.toolbar.save', save.bind(this));

            this.sandbox.on('sulu.permission-tab.saved', function() {
                setHeaderBar.call(this, true);
            }.bind(this));
        },

        render = function() {
            this.$el.html(this.renderTemplate('/admin/security/template/permission-tab/form'));
        },

        initializeMatrix = function() {
            var $matrix = this.sandbox.dom.createElement('<div id="matrix" class="loading"/>');

            this.sandbox.dom.append(matrixContainerSelector, $matrix);

            var roles = new Roles();
            this.sandbox.data.when(
                roles.fetch(),
                this.sandbox.util.ajax({
                    url: [permissionUrl, '?type=', permissionData.type, '&id=', permissionData.id].join('')
                })
            ).done(
                function(roleResponse, permissionResponse) {
                    roles = roles.toJSON();

                    var permissionResponseData = permissionResponse[0],
                        matrixData = [],
                        verticalCaptions = [],
                        verticalValues = [];

                    // set the data for all available roles
                    this.sandbox.util.each(roles, function(index, role) {
                        var data = {}, matrixRoleData = [];

                        // set the captions and values for the matrix
                        verticalCaptions.push(role.name);
                        verticalValues.push(role.identifier);

                        // initialize the data
                        this.sandbox.util.each(permissions, function(index, permission) {
                            data[permission.value] = false;
                        }.bind(this));

                        // set the data from the permissions
                        if (permissionResponseData.hasOwnProperty(role.identifier)) {
                            // if object permissions already exists set from role data
                            this.sandbox.util.each(
                                permissionResponseData.permissions[role.identifier],
                                function(index, value) {
                                    data[index] = value;
                                    matrixRoleData.push(value);
                                }
                            );
                        } else {
                            // if no object permission exists yet set the context permissions as defaults
                            matrixRoleData.push(false, false, false, false);
                        }

                        permissionData.permissions[role.identifier] = data;
                        matrixData[index] = matrixRoleData;
                    }.bind(this));

                    this.sandbox.start([
                        {
                            name: 'matrix@husky',
                            options: {
                                el: matrixSelector,
                                captions: {
                                    type: this.sandbox.translate('security.roles'),
                                    horizontal: this.sandbox.translate('security.roles.permissions'),
                                    all: this.sandbox.translate('security.roles.all'),
                                    none: this.sandbox.translate('security.roles.none'),
                                    vertical: verticalCaptions
                                },
                                values: {
                                    vertical: verticalValues,
                                    horizontal: permissions,
                                    titles: this.sandbox.translateArray(permissionTitles)
                                },
                                data: matrixData
                            }
                        }
                    ]);

                    this.sandbox.dom.removeClass($matrix, 'loading');
                }.bind(this)
            );
        },

        changePermission = function(data) {
            permissionData.permissions[data.section][data.value] = data.activated;
        },

        save = function() {
            this.sandbox.emit('sulu.permission-tab.save', permissionData);
        },

        setHeaderBar = function(saved) {
            this.sandbox.emit('sulu.header.toolbar.state.change', 'edit', saved, true);
        },

        listenForChange = function() {
            this.sandbox.on('husky.matrix.changed', setHeaderBar.bind(this, false));
        };

    return {
        name: 'Sulu Security Object Permission Tab',

        view: true,

        templates: ['/admin/security/template/permission-tab/form'],

        initialize: function() {
            permissionData.id = this.options.id;
            permissionData.type = this.options.type;

            render.call(this);
            initializeMatrix.call(this);
            bindCustomEvents.call(this);
            listenForChange.call(this);
        }
    }
});

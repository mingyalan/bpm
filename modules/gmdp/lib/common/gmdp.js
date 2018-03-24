exports.init_gmdp = function() {
    return {
        // core
        core_service : require('./common/core/services/core_service'),
        core_auth_check : require('./common/core/middlewares/auth_check'),
        core_cas_client : require('./common/core/middlewares/cas_client'),
        core_local_login : require('./common/core/middlewares/local_login'),
        core_mongoose_utils : require('./common/core/mongodb/mongoose_utils'),
        core_app_utils : require('./common/core/utils/app_utils'),
        core_memcached_utils : require('./common/core/utils/memcached_utils'),
        core_tree_utils : require('./common/core/utils/tree_utils'),
        core_mount_routes : require('./common/core/utils/mount_routes'),
        uum_user_services : require('./common/uum/services/user_service'),
        uum_org_services : require('./common/uum/services/org_service'),
        uum_role_services : require('./common/uum/services/role_service'),
        uum_login_services : require('./common/uum/services/login_service'),
        core_user_model : require('./common/core/models/user_model'),
        mysql_utils : require('./common/core/utils/mysql_utils'),
        role_menu_model : require('./common/core/models/role_menu_model'),

        // 初始化系统
        init_sys : function() {
            require('./common/core/services/core_service').init();
        },

        // 初始化路由
        init_route : function(options) {

            var _app = options.app;
            var _basePath = options.basePath;

            var route_mapping_prefix_map = {
                core : "",
                syscfg : "/admin/api/common/syscfg/",
                uum : "/admin/api/common/uum/",
                portal : "/admin/api/common/portal/",
                app : "/admin/api/common/app/"
            };

            // core
            _app.use(_basePath + route_mapping_prefix_map.core, require('./common/core/routes/index'));

            // syscfg
            _app.use(_basePath + route_mapping_prefix_map.syscfg + "dict", require('./common/syscfg/routes/dict'));
            _app.use(_basePath + route_mapping_prefix_map.syscfg + "menu", require('./common/syscfg/routes/menu'));
            _app.use(_basePath + route_mapping_prefix_map.syscfg + "notice", require('./common/syscfg/routes/notice'));
            _app.use(_basePath + route_mapping_prefix_map.syscfg + "param", require('./common/syscfg/routes/param'));
            _app.use(_basePath + route_mapping_prefix_map.syscfg + "system", require('./common/syscfg/routes/system'));

            // uum
            _app.use(_basePath + route_mapping_prefix_map.uum + "org", require('./common/uum/routes/org'));
            _app.use(_basePath + route_mapping_prefix_map.uum + "other_org", require('./common/uum/routes/other_org'));
            _app.use(_basePath + route_mapping_prefix_map.uum + "role", require('./common/uum/routes/role'));
            _app.use(_basePath + route_mapping_prefix_map.uum + "user", require('./common/uum/routes/user'));
            _app.use(_basePath + route_mapping_prefix_map.uum + "login_err", require('./common/uum/routes/login_err'));

            // portal
            _app.use(_basePath + route_mapping_prefix_map.portal + "module", require('./common/portal/routes/module'));
            _app.use(_basePath + route_mapping_prefix_map.portal + "page", require('./common/portal/routes/page'));

            // app
            _app.use(_basePath + route_mapping_prefix_map.app + "app_api", require('./common/app/routes/app_api'));
        },
        init_cas : function(options) {
            var _app = options.app;
            var config = require('../config');
            var auth_type = config.auth.auth_type;
            if (auth_type == 'cas') {
                var cas_client = require('./common/core/middlewares/cas_client');
                var cas = new cas_client({
                    cas_url: config.auth.cas_server_url,
                    service_url: config.auth.cas_client_service_url,
                    cas_version: !config.auth.cas_server_version ? '2.0' : config.auth.cas_server_version,
                    renew: false,
                    is_dev_mode: false,
                    dev_mode_user: '',
                    dev_mode_info: {},
                    session_name: !config.auth.cas_client_session_name ? 'cas_sso_user' : config.auth.cas_client_session_name,
                    session_info: !config.auth.cas_client_session_name ? 'cas_sso_user_info' : config.auth.cas_client_session_name + '_info',
                    destroy_session: false
                });
                _app.use(cas.bounce);
            }
        }
    };
}();



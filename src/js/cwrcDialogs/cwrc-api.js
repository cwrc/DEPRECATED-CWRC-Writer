/**
 * @author mpm1
 *
 * Requires jQuery
 */
// NOT USED - CWRC annotiation JavaScript API calls
function CwrcAnnotion(url, jq){
        if (!jq) {
                jq = $;
        }

        // Public Functions
        this.searchAnnotion = function(searchObject){
                // TODO: Should we search on annotations?       
        }
        
        this.getAnnotaion = function(pid){
                var result = result;

                jq.ajax({
                        url : url + '/annotation/' + pid,
                        type : 'GET',
                        async : false,
                        success : function(data) {
                                result = data;
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                return result;
        }
        
        this.newAnnotation = function(data) {
                var result = result;

                jq.ajax({
                        url : url + '/annotation',
                        type : 'POST',
                        data : {
                                method : 'post',
                                data: data
                        },
                        async : false,
                        success : function(data) {
                                result = data;
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                return jq.parseJSON(result);
        }
        
        this.modifyAnnotation = function(pid, data) {
                var result = result;

                jq.ajax({
                        url : url + '/annotation/' + pid,
                        type : 'POST',
                        data : {
                                method : 'put',
                                data: data
                        },
                        async : false,
                        success : function(data) {
                                result = data;
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                return jq.parseJSON(result);
        }

        this.deleteAnnotation = function(pid) {
                var result = result;

                jq.ajax({
                        url : url + '/annotation/' + pid,
                        type : 'POST',
                        async : false,
                        data: {
                                method: 'delete'
                        },
                        success : function(data) {
                                result = data;
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                return jq.parseJSON(result);
        }
}

// CWRC Entity JavaScript API calls
function CwrcEntity(type, url, jq) {
        if (!jq) {
                jq = $;
        }

        // Public Functions
        this.searchEntity = function(searchObject){
                var limit = searchObject.limit !== undefined ? searchObject.limit : 100;
                var page = searchObject.page !== undefined ? searchObject.page : 0;
                var restrictions = searchObject.restrictions !== undefined ? searchObject.restrictions : [];

                return jq.ajax({
                        url : url + "search/" + type,  
                        type : 'GET',
                        async : true,
                        dataType : "json",
                        data: {
                                query: searchObject.query,
                                limit: limit,
                                page: page,
                                restrictions: restrictions
                        },
                        success : function(data) {
                                result = data === "" ? {} : data;
                                
                                searchObject.success(result);
                        },
                        error : function(error) {
                                searchObject.error(error);
                        }
                });
        }
        
        this.getEntity = function(pid) {
                var result = result;

                jq.ajax({
                        url : url + type + "/" + pid,
                        type : 'GET',
                        async : false,
                        success : function(data, status, xhr) {
                                var ct = xhr.getResponseHeader("content-type") || "";
                                if (ct.indexOf('json') > -1)
                                {
                                  // assume XML wrapped in JSON
                                  // and the following version of the API
                                  // https://github.com/cwrc/cwrc_entities/commit/b49473832adad70a2e848c86fb5bc312e8616cea 
                                  result = jq.parseXML(data);
                                }
                                else
                                {
                                  result = data;
                                }
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                return result;
        }

        this.newEntity = function(data) {
                var result = result;

                jq.ajax({
                        url : url + type,
                        type : 'POST',
                        data : {
                                method : 'post',
                                data: data
                        },
                        async : false,
                        success : function(data) {
                                result = data;
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                return result;
        }

        this.modifyEntity = function(pid, data) {
                var result = result;

                jq.ajax({
                        url : url + type + '/' + pid,
                        type : 'POST',
                        data : {
                                method : 'put',
                                data: data
                        },
                        async : false,
                        success : function(data) {
                                result = data;
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                //return jq.parseJSON(result);
                return result;
        }

        this.deleteEntity = function(pid) {
                var result = result;

                jq.ajax({
                        url : url + type + "/" + pid,
                        type : 'POST',
                        async : false,
                        data: {
                                method: 'delete'
                        },
                        success : function(data) {
                                result = data;
                        },
                        error : function(error) {
                                result = error;
                        }
                });

                return result;
        }
        
        this.listEntity = function(totalPerPage, page){
                alert("Page " + page);
        }
}

function CwrcApi(url, jq) {
        if (!jq) {
                jq = $;
        }

        // Class creation
        if (url.indexOf("/", (url.length-1) ) == -1) {
                url = url + "/";
        }

        // Private variables
        var _this = this;

        // Public variables
        this.person = new CwrcEntity('person', url, jq);
        this.organization = new CwrcEntity('organization', url, jq);
        this.title = new CwrcEntity('title', url, jq);
        //this.event = new CwrcEntity('event', url, jq); <- Can we use event or is that a javascript keyword?
        this.place = new CwrcEntity('place', url, jq);
        this.annotation = new CwrcAnnotion(url, jq);
        this.isInitialized = false;

        // Private functions
        this.updateIsInitialized = function(){
                jq.ajax({
                        url : url + "is_initialized",
                        type : 'POST',
                        data : {
                                name : name
                        },
                        success : function(data) {
                                _this.isInitialized = JSON.parse(data).result;
                        },
                        error : function(error) {
                                result = error;
                                _this.isInitialized = false;
                        }
                });
        }

        // NOT USED - 2015-02-18
        // Public functions
        /**
         * Initialize the data using a set of existing cookies.
         * var name The cookie to obtaine the information from
         */
        // NOT USED - 2015-02-18
        this.initializeWithCookieData = function(data) {
                var result = result;

                        
                jq.ajax({
                        url : url + "initialize_cookie",
                        type : 'POST',
                        async : false,
                        data : {
                                data: data
                        },
                        success : function(data) {
                                result = data;
                                _this.isInitialized = true;
                        },
                        error : function(error) {
                                result = error;
                        }
                }); 


                return result;
        }

        // NOT USED - 2015-02-18
        this.initializeWithLogin = function(username, password) {
                var result = result;

                        
                jq.ajax({
                        url : url + "initialize_user",
                        type : 'POST',
                        async : false,
                        data : {
                                username : username,
                                password : password
                        },
                        success : function(data) {
                                result = data;
                                _this.isInitialized = true;
                        },
                        error : function(error) {
                                result = error;
                        }
                }); 

                        
                return result;
        }

        // NOT USED - 2015-02-18
        this.logout = function() {
                var result = result;

                if (!_this.isInitialized()) {
                        jq.ajax({
                                url : url + "logout",
                                type : 'POST',
                                async : false,
                                success : function(data) {
                                        result = data;
                                },
                                error : function(error) {
                                        result = error;
                                }
                        });
                }

                _this.isInitialized = false;
                return result;
        }
        
        //this.updateIsInitialized();

        return this;
}

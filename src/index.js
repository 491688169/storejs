import 'babel-polyfill'

const storeAPI = {
    version: require('../package').version,
    enabled: false,

    get: function(key, defaultValue) {
        const data = this.storage.read(this._namespacePrefix + key)
        return this._deserialize(data)
    },

    set: function(key, value) {
        if(value === undefined) {
            return this.remove(key)
        }
        this.storage.write({key: value})
        return value
    },

    remove: function(key) {
        this.storage.remove(this._namespacePrefix + key)
    },

    each: function(callback) {
        const _self = this
        this.storage.each(function(val, key) {
            callback.call(_self, this._deserialize(val), key.replace(this._namespacePrefixRegExp, ''))
        })
    },

    clearAll: function() {
        this.storage.clearAll()
    }


}

function createStore(store, plugins, namespace) {
    if(!namespace) namespace = ''
    if(store && !Array.isArray(store)) store = [store]
    if(plugins && !Array.isArray(plugins)) plugins = [plugins]

    const namespacePrefix = namespace ? `__store__/${namespace}/` : ''
    const namespacePrefixRegExp = namespace ? new RegExp('^' + namespacePrefix) : null
    const legalNamespaces = /^[a-zA-Z0-9]*$/
    if(!legalNamespaces.test(namespace)) {
        throw Error('store can only have alphanumerics, underscores and dashes')
    }

    const _privateStoreProps = {
        _namespacePrefix: namespacePrefix,
        _namespacePrefixRegExp: namespacePrefixRegExp,
        _testStorage: function(storage) {
            const testStr = '__store__test__'
            try {
                storage.write({testStr})
                const ok = (storage.read(testStr) === testStr)
                storage.remove(testStr)
                return ok
            } catch(err) {
                return false
            }
        },

        _addStorage: function(storage) {
            if(this.enabled) return
            if(this._testStorage(storage)) {
                this.storage = storage
                this.enabled = true
            }
        },

        _deserialize: function(strVal, defaultValue) {
            if(!strVal) return defaultValue
            // 有可能之前不是通过本插件存储的，所以JSON.parse可能会报错
            let val = ''
            try {
                val = JSON.parse(strVal)
            } catch(err) {
                val = strVal
            }

            return val !== undefined ? val : defaultValue
        }

    }
}





module.exports = {
    createStore
}

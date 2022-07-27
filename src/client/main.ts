import { doSomething } from '##/client/util'

document.addEventListener('DOMContentLoaded', function () {
  let foo: string = 'foo'
  console.log('Loaded client side script', foo)
  console.log(doSomething())
})

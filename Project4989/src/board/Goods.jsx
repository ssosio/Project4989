import React from 'react'

const Goods = () => {
  return (
    <div>
      <table>
        <tr>
          <select name='category'>
            <option value="used_items"></option>
            <option value="cars"></option>
            <option value="real_estates"></option>
          </select>
        </tr>
      </table>
    </div>
  )
}

export default Goods
